import { describe, expect, it } from "vitest";
import {
  resolveStatus,
  translateEvent,
} from "@/modules/tracking/domain/event-translation-engine";
import type { RawTrackingEvent } from "@/modules/tracking/domain/raw-tracking-event";

function ev(partial: Partial<RawTrackingEvent> & { description: string }): RawTrackingEvent {
  return {
    occurredAt: new Date("2026-06-08T10:00:00Z"),
    statusCode: null,
    location: null,
    countryCode: null,
    ...partial,
  };
}

describe("translateEvent", () => {
  it("maps China dispatch events to DISPATCHED_CHINA", () => {
    expect(translateEvent(ev({ description: "EDI received" }))).toBe("DISPATCHED_CHINA");
    expect(translateEvent(ev({ description: "Insert item into bag" }))).toBe(
      "DISPATCHED_CHINA",
    );
    expect(translateEvent(ev({ description: "Flight departed" }))).toBe("DISPATCHED_CHINA");
  });

  it("maps an AR country event to ARRIVED_ARGENTINA", () => {
    expect(translateEvent(ev({ description: "Arrival at facility", countryCode: "AR" }))).toBe(
      "ARRIVED_ARGENTINA",
    );
  });

  it("maps customs events to CUSTOMS_PROCESSING", () => {
    expect(translateEvent(ev({ description: "Customs processing" }))).toBe(
      "CUSTOMS_PROCESSING",
    );
    expect(translateEvent(ev({ description: "Exchange office" }))).toBe("CUSTOMS_PROCESSING");
  });

  it("maps release to DECLARED", () => {
    expect(translateEvent(ev({ description: "Released from customs" }))).toBe("DECLARED");
  });

  it("maps delivery routing to EN_ROUTE_ROSARIO", () => {
    expect(translateEvent(ev({ description: "Out for delivery" }))).toBe("EN_ROUTE_ROSARIO");
  });

  it("returns null for unknown technical events", () => {
    expect(translateEvent(ev({ description: "Some internal scan code XYZ" }))).toBeNull();
  });
});

describe("resolveStatus (monotonicity)", () => {
  it("advances to the furthest reached status", () => {
    const events = [
      ev({ description: "EDI received", occurredAt: new Date("2026-06-08T00:00:00Z") }),
      ev({
        description: "Customs processing",
        occurredAt: new Date("2026-06-20T00:00:00Z"),
      }),
    ];
    const result = resolveStatus("CONFIRMED", events);
    expect(result.status).toBe("CUSTOMS_PROCESSING");
    expect(result.advanced).toBe(true);
  });

  it("never regresses below the current status", () => {
    // Current status is already in Argentina; an old China event must not pull it back.
    const events = [ev({ description: "EDI received" })];
    const result = resolveStatus("CUSTOMS_PROCESSING", events);
    expect(result.status).toBe("CUSTOMS_PROCESSING");
    expect(result.advanced).toBe(false);
  });

  it("ignores unknown events without advancing", () => {
    const events = [ev({ description: "Unknown scan" })];
    const result = resolveStatus("DISPATCHED_CHINA", events);
    expect(result.status).toBe("DISPATCHED_CHINA");
    expect(result.advanced).toBe(false);
  });
});
