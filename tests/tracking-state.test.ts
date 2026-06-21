import { describe, expect, it } from "vitest";
import {
  TRACKING_STEPS,
  trackingSceneForStatus,
  trackingStepForStatus,
} from "@/modules/portal/tracking/tracking-state";

describe("trackingSceneForStatus", () => {
  it.each([
    ["CONFIRMED", "confirmed", "international", false],
    ["DISPATCHED_CHINA", "international", "international", true],
    ["ARRIVED_ARGENTINA", "customs", "customs", false],
    ["CUSTOMS_PROCESSING", "customs", "customs", false],
    ["DECLARED", "customs", "customs", false],
    ["EN_ROUTE_ROSARIO", "to-rosario", "route", true],
    ["RECEIVED_BY_US", "distribution", "distribution", false],
    ["DELIVERED", "delivered", "delivered", false],
    ["CANCELLED", "confirmed", "cancelled", false],
  ] as const)("maps %s to the %s step and %s scene", (status, expectedStep, expectedScene, activeRoute) => {
    const result = trackingSceneForStatus(status, status === "DELIVERED" ? 100 : 45);
    expect(result.step).toBe(expectedStep);
    expect(result.scene).toBe(expectedScene);
    expect(result.activeRoute).toBe(activeRoute);
  });

  it("exposes only the seven final client-facing stages", () => {
    expect(TRACKING_STEPS.map((step) => step.label)).toEqual([
      "Pedido confirmado",
      "En preparación",
      "En vuelo internacional",
      "En aduana",
      "En camino a Rosario",
      "En distribución local",
      "Entregado",
    ]);
    expect(trackingStepForStatus("DECLARED")).toBe("customs");
  });

  it("keeps domain progress except for terminal overrides", () => {
    expect(trackingSceneForStatus("DISPATCHED_CHINA", 25).progress).toBe(25);
    expect(trackingSceneForStatus("DELIVERED", 92).progress).toBe(100);
    expect(trackingSceneForStatus("CANCELLED", 52).progress).toBe(0);
  });
});
