// Port for the international tracking provider. Today implemented by 17Track.
// The sync use case depends on this interface, not on any concrete provider.

import type { RawTrackingEvent } from "../domain/raw-tracking-event";

export interface FetchResult {
  events: RawTrackingEvent[];
  /** Opaque provider payload, stored for debugging/audit. */
  rawPayload: unknown;
}

export interface WebhookParseResult {
  trackingNumber: string;
  events: RawTrackingEvent[];
  rawPayload: unknown;
}

export interface TrackingProvider {
  /** Register a tracking number so the provider starts following it. */
  register(trackingNumber: string): Promise<void>;
  /** Pull the latest events for a tracking number. */
  fetchEvents(trackingNumber: string): Promise<FetchResult>;
  /** Parse an inbound webhook payload, or null if it is not actionable. */
  parseWebhook(payload: unknown): WebhookParseResult | null;
}
