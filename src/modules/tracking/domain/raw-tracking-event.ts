// Provider-agnostic representation of a tracking event.
// Adapters (e.g. 17Track) normalize their payloads into this shape so the
// domain never depends on any specific tracking provider.

export interface RawTrackingEvent {
  /** When the carrier recorded the event. */
  occurredAt: Date;
  /** Free-text description from the provider, e.g. "Customs processing". */
  description: string;
  /** Provider-specific status code, if any. */
  statusCode?: string | null;
  /** Human-readable location, e.g. "Guangzhou". */
  location?: string | null;
  /** ISO country code, e.g. "CN" or "AR". */
  countryCode?: string | null;
}

/** Stable hash inputs for idempotent de-duplication of events. */
export function eventDedupeHash(event: RawTrackingEvent): string {
  const parts = [
    event.occurredAt.toISOString(),
    event.description.trim().toLowerCase(),
    (event.statusCode ?? "").trim().toLowerCase(),
    (event.location ?? "").trim().toLowerCase(),
  ];
  return parts.join("|");
}
