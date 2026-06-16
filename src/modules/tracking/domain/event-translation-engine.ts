// Event Translation Engine — the core of the domain.
//
// Pure, dependency-free logic that converts raw carrier events into the
// client-facing business statuses. No Prisma, no network, no Next.js here so
// it can be exhaustively unit-tested with real provider payloads.
//
// Two business rules are enforced:
//   1. Translation: map technical events -> TrackableStatus (or null if unknown).
//   2. Monotonicity: the order status only ever moves forward.

import {
  ORDER_STATUS_SEQUENCE,
  maxStatus,
  statusRank,
  type TrackableStatus,
} from "@/shared/config/order-status";
import type { RawTrackingEvent } from "./raw-tracking-event";

interface TranslationRule {
  status: TrackableStatus;
  /** Optional regexes matched against the event description (case-insensitive). */
  description?: RegExp[];
  /** Optional explicit country code match. */
  countryCode?: string;
  /** Custom predicate for complex cases. */
  predicate?: (event: RawTrackingEvent) => boolean;
}

/**
 * Rules are evaluated top to bottom; the FIRST match wins for a single event.
 * Order matters: more specific / later-stage rules come first so that, e.g.,
 * a customs event in Argentina is not swallowed by the generic "arrived AR" rule.
 *
 * Statuses RECEIVED_BY_US and DELIVERED are set manually by an admin (they do
 * not originate from the carrier), so there are no auto rules for them here.
 */
const RULES: TranslationRule[] = [
  {
    status: "EN_ROUTE_ROSARIO",
    description: [
      /out for delivery/i,
      /in transit to .*(rosario|destination)/i,
      /en route/i,
      /salida.*reparto/i,
      /en camino/i,
    ],
  },
  {
    status: "DECLARED",
    description: [
      /released from customs/i,
      /customs.*(cleared|released|clearance complete)/i,
      /item declared/i,
      /declared/i,
      /liberad[oa]/i,
    ],
  },
  {
    status: "CUSTOMS_PROCESSING",
    description: [
      /customs/i,
      /exchange office/i,
      /import clearance/i,
      /aduana/i,
      /held by customs/i,
    ],
  },
  {
    status: "ARRIVED_ARGENTINA",
    countryCode: "AR",
  },
  {
    status: "ARRIVED_ARGENTINA",
    description: [
      /arrived.*(argentina|destination country)/i,
      /arrived at.*(buenos aires|ezeiza)/i,
      /llegó a argentina/i,
    ],
  },
  {
    status: "DISPATCHED_CHINA",
    description: [
      /edi received/i,
      /insert item into bag/i,
      /departed/i,
      /dispatched/i,
      /flight departed/i,
      /handed over to airline/i,
      /export/i,
      /accepted by/i,
    ],
  },
];

/**
 * Translate a single raw event into a business status, or null if the event
 * does not correspond to any client-facing milestone.
 */
export function translateEvent(event: RawTrackingEvent): TrackableStatus | null {
  for (const rule of RULES) {
    if (rule.countryCode && event.countryCode?.toUpperCase() === rule.countryCode) {
      return rule.status;
    }
    if (rule.predicate && rule.predicate(event)) {
      return rule.status;
    }
    if (rule.description?.some((re) => re.test(event.description))) {
      return rule.status;
    }
  }
  return null;
}

export interface TranslationResult {
  /** The resulting status after applying all events + monotonicity. */
  status: TrackableStatus;
  /** Whether the status advanced beyond the provided current status. */
  advanced: boolean;
}

/**
 * Given the current status and a batch of raw events, compute the resulting
 * status. The status never regresses: events that translate to an earlier
 * stage are ignored for the purpose of `currentStatus` (they are still stored
 * as raw history elsewhere).
 */
export function resolveStatus(
  currentStatus: TrackableStatus,
  events: RawTrackingEvent[],
): TranslationResult {
  let resolved = currentStatus;

  // Evaluate events in chronological order so the timeline stays coherent.
  const ordered = [...events].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  );

  for (const event of ordered) {
    const translated = translateEvent(event);
    if (translated) {
      resolved = maxStatus(resolved, translated);
    }
  }

  return {
    status: resolved,
    advanced: statusRank(resolved) > statusRank(currentStatus),
  };
}

/** Exposed for tests / introspection. */
export const __ORDER_STATUS_SEQUENCE = ORDER_STATUS_SEQUENCE;
