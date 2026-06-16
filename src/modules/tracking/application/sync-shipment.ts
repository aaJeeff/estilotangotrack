// Shipment sync use case. Idempotent and monotonic:
//   - Events are de-duplicated by [shipmentId, dedupeHash].
//   - The order status only advances (never regresses).
//   - Triggerable by webhook, cron, or the manual "Actualizar ahora" button.

import "server-only";
import { addHours } from "date-fns";
import { prisma } from "@/shared/lib/prisma";
import {
  ORDER_STATUS_META,
  isTerminal,
  syncZoneForStatus,
  type TrackableStatus,
} from "@/shared/config/order-status";
import { notifyStatusChange } from "@/modules/notifications/send";
import { resolveStatus } from "../domain/event-translation-engine";
import { eventDedupeHash, type RawTrackingEvent } from "../domain/raw-tracking-event";
import { trackingProvider } from "../infrastructure/seventeen-track.adapter";
import type { SyncZone } from "@prisma/client";
import { getSyncFrequencies } from "./sync-frequencies";

export interface SyncResult {
  ok: boolean;
  advanced: boolean;
  newStatus?: TrackableStatus;
  eventsAdded: number;
  error?: string;
}

/** Sync a single shipment by id. Optionally accepts pre-parsed webhook events. */
export async function syncShipment(
  shipmentId: string,
  opts: { events?: RawTrackingEvent[]; rawPayload?: unknown } = {},
): Promise<SyncResult> {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { order: { select: { id: true, currentStatus: true } } },
  });
  if (!shipment) return { ok: false, advanced: false, eventsAdded: 0, error: "not found" };

  const order = shipment.order;

  // Nothing left to track for terminal orders.
  if (isTerminal(order.currentStatus)) {
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: { lastSyncedAt: new Date(), nextSyncAt: null },
    });
    return { ok: true, advanced: false, eventsAdded: 0 };
  }

  // 1. Obtain events (from the webhook payload or by pulling the provider).
  let incoming: RawTrackingEvent[];
  let rawPayload: unknown = opts.rawPayload;
  try {
    if (opts.events) {
      incoming = opts.events;
    } else {
      const fetched = await trackingProvider.fetchEvents(shipment.trackingNumber);
      incoming = fetched.events;
      rawPayload = fetched.rawPayload;
    }
  } catch (err) {
    // Retry sooner on failure.
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: { lastSyncedAt: new Date(), nextSyncAt: addHours(new Date(), 1) },
    });
    return {
      ok: false,
      advanced: false,
      eventsAdded: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 2. Persist new raw events (idempotent).
  let eventsAdded = 0;
  if (incoming.length > 0) {
    const result = await prisma.trackingEvent.createMany({
      data: incoming.map((e) => ({
        shipmentId,
        occurredAt: e.occurredAt,
        rawDescription: e.description,
        rawStatusCode: e.statusCode ?? null,
        location: e.location ?? null,
        countryCode: e.countryCode ?? null,
        provider: shipment.provider,
        payload: (e as unknown as object) ?? {},
        dedupeHash: eventDedupeHash(e),
      })),
      skipDuplicates: true,
    });
    eventsAdded = result.count;
  }

  // 3. Resolve status over ALL stored events (robust to out-of-order batches).
  const stored = await prisma.trackingEvent.findMany({
    where: { shipmentId },
    orderBy: { occurredAt: "asc" },
  });
  const allEvents: RawTrackingEvent[] = stored.map((e) => ({
    occurredAt: e.occurredAt,
    description: e.rawDescription,
    statusCode: e.rawStatusCode,
    location: e.location,
    countryCode: e.countryCode,
  }));

  const currentStatus = order.currentStatus as TrackableStatus;
  const { status: resolved, advanced } = resolveStatus(currentStatus, allEvents);

  // 4. Apply status change + reschedule.
  const zone = syncZoneForStatus(resolved) as SyncZone;
  const freq = await getSyncFrequencies();
  const nextSyncAt = isTerminal(resolved)
    ? null
    : addHours(new Date(), freq[syncZoneForStatus(resolved)]);

  await prisma.$transaction(async (tx) => {
    if (advanced) {
      await tx.order.update({
        where: { id: order.id },
        data: { currentStatus: resolved },
      });
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: resolved, source: "AUTO_TRANSLATED" },
      });
    }
    await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        lastSyncedAt: new Date(),
        nextSyncAt,
        syncZone: zone,
        rawLastPayload: (rawPayload as object) ?? undefined,
      },
    });
  });

  // 5. Fire client email for notify statuses (deduped internally).
  if (advanced && ORDER_STATUS_META[resolved]?.notify) {
    await notifyStatusChange(order.id, resolved);
  }

  return {
    ok: true,
    advanced,
    newStatus: resolved,
    eventsAdded,
  };
}

/** Sync every shipment whose nextSyncAt is due. Used by the cron endpoint. */
export async function syncDueShipments(now: Date = new Date()): Promise<{
  processed: number;
  advanced: number;
}> {
  const due = await prisma.shipment.findMany({
    where: {
      nextSyncAt: { lte: now },
      order: { currentStatus: { notIn: ["DELIVERED", "CANCELLED"] } },
    },
    select: { id: true },
    take: 100,
  });

  let advanced = 0;
  for (const s of due) {
    const result = await syncShipment(s.id);
    if (result.advanced) advanced += 1;
  }
  return { processed: due.length, advanced };
}
