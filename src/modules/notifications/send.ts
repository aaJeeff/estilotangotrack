// High-level notification service. Enforces "send once per event" via the
// Notification.dedupeKey unique constraint, and records SENT / FAILED state.

import "server-only";
import { prisma } from "@/shared/lib/prisma";
import { serverEnv } from "@/shared/lib/env";
import { formatOrderNumber } from "@/shared/lib/format";
import { ORDER_STATUS_META, type TrackableStatus } from "@/shared/config/order-status";
import { notificationSender } from "./infrastructure/resend-sender";

/**
 * Sends the client a status-update email if (a) the status is a notify status
 * and (b) it was not already sent. Safe to call repeatedly and concurrently.
 */
export async function notifyStatusChange(
  orderId: string,
  status: TrackableStatus,
): Promise<void> {
  const meta = ORDER_STATUS_META[status];
  if (!meta.notify) return;

  const dedupeKey = `${orderId}:${status}:EMAIL`;

  // Claim the dedupe slot. If it already exists, another run handled it.
  let notificationId: string;
  try {
    const created = await prisma.notification.create({
      data: {
        orderId,
        channel: "EMAIL",
        templateKey: `status:${status}`,
        triggerStatus: status,
        status: "PENDING",
        dedupeKey,
      },
      select: { id: true },
    });
    notificationId = created.id;
  } catch {
    // Unique violation on dedupeKey -> already claimed; nothing to do.
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { client: true },
  });

  if (!order || !order.client) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: "FAILED", error: "Order or client not found" },
    });
    return;
  }

  try {
    await notificationSender.sendStatusUpdate({
      to: order.client.email,
      fullName: order.client.fullName,
      orderNumber: formatOrderNumber(order.orderNumber),
      statusLabel: meta.label,
      helpText: meta.help,
      trackingUrl: `${serverEnv.appUrl()}/portal/orders/${order.id}`,
    });
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: "SENT", sentAt: new Date() },
    });
  } catch (err) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: "FAILED", error: err instanceof Error ? err.message : String(err) },
    });
  }
}
