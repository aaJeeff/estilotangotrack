// 17Track provider adapter (API v2.2).
// Normalizes 17Track payloads into the provider-agnostic RawTrackingEvent shape.
// Field mapping is defensive: 17Track payloads vary, so we read optional paths
// and fall back gracefully. Tune the field paths against real payloads.

import "server-only";
import { serverEnv } from "@/shared/lib/env";
import type { RawTrackingEvent } from "../domain/raw-tracking-event";
import type {
  FetchResult,
  TrackingProvider,
  WebhookParseResult,
} from "../application/tracking-provider";

const API_BASE = "https://api.17track.net/track/v2.2";

// ---- small safe accessors (avoid `any`) -----------------------------------
function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}
function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** Normalize a country name/code into an ISO-2 code where possible. */
function normalizeCountry(v: unknown): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  const upper = s.toUpperCase();
  if (upper.length === 2) return upper;
  if (/argentin/i.test(s)) return "AR";
  if (/china/i.test(s)) return "CN";
  return upper;
}

/** Map 17Track `track_info` into a list of RawTrackingEvent. */
function normalizeTrackInfo(trackInfo: unknown): RawTrackingEvent[] {
  const tracking = asRecord(asRecord(trackInfo).tracking);
  const providers = asArray(tracking.providers);

  const events: RawTrackingEvent[] = [];
  for (const provider of providers) {
    for (const rawEvent of asArray(asRecord(provider).events)) {
      const ev = asRecord(rawEvent);
      const address = asRecord(ev.address);
      const timeIso = str(ev.time_iso) ?? str(ev.time_utc);
      const description = str(ev.description) ?? str(ev.stage) ?? "";
      if (!timeIso || !description) continue;

      events.push({
        occurredAt: new Date(timeIso),
        description,
        statusCode: str(ev.stage) ?? str(ev.sub_status) ?? null,
        location: str(ev.location) ?? str(address.city) ?? null,
        countryCode:
          normalizeCountry(address.country_iso) ??
          normalizeCountry(address.country) ??
          null,
      });
    }
  }
  return events;
}

function firstAccepted(payload: unknown): { number?: string; trackInfo?: unknown } {
  const data = asRecord(asRecord(payload).data);
  const accepted = asArray(data.accepted);
  const first = asRecord(accepted[0]);
  return { number: str(first.number), trackInfo: first.track_info };
}

export class SeventeenTrackAdapter implements TrackingProvider {
  private headers() {
    return {
      "17token": serverEnv.seventeenTrackApiKey(),
      "Content-Type": "application/json",
    };
  }

  async register(trackingNumber: string): Promise<void> {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify([{ number: trackingNumber }]),
    });
    if (!res.ok) {
      throw new Error(`17Track register failed: ${res.status}`);
    }
  }

  async fetchEvents(trackingNumber: string): Promise<FetchResult> {
    const res = await fetch(`${API_BASE}/gettrackinfo`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify([{ number: trackingNumber }]),
    });
    if (!res.ok) {
      throw new Error(`17Track gettrackinfo failed: ${res.status}`);
    }
    const payload: unknown = await res.json();
    const { trackInfo } = firstAccepted(payload);
    return { events: normalizeTrackInfo(trackInfo), rawPayload: payload };
  }

  parseWebhook(payload: unknown): WebhookParseResult | null {
    // 17Track push: { event, data: { number, track_info } }
    const root = asRecord(payload);
    const data = asRecord(root.data);
    const trackingNumber = str(data.number);
    const trackInfo = data.track_info;
    if (!trackingNumber || !trackInfo) {
      // Fallback to the accepted[] shape if present.
      const { number, trackInfo: ti } = firstAccepted(payload);
      if (!number || !ti) return null;
      return { trackingNumber: number, events: normalizeTrackInfo(ti), rawPayload: payload };
    }
    return {
      trackingNumber,
      events: normalizeTrackInfo(trackInfo),
      rawPayload: payload,
    };
  }
}

export const trackingProvider: TrackingProvider = new SeventeenTrackAdapter();
