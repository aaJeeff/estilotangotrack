"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/prisma";
import { requireRole } from "@/shared/lib/auth/session";
import { serverEnv } from "@/shared/lib/env";
import { formatOrderNumber } from "@/shared/lib/format";
import { ORDER_STATUS_META, type TrackableStatus } from "@/shared/config/order-status";
import { notificationSender } from "./infrastructure/resend-sender";
import type { FormState } from "@/shared/types/form";

function isTrackableStatus(status: string | null): status is TrackableStatus {
  return Boolean(status && status in ORDER_STATUS_META);
}

export async function retryNotificationAction(formData: FormData): Promise<FormState> {
  await requireRole("ADMIN");
  const id = String(formData.get("notificationId") ?? "");
  if (!id) return { error: "Notificación no encontrada." };

  const notification = await prisma.notification.findUnique({
    where: { id },
    include: { order: { include: { client: true } } },
  });

  if (!notification) return { error: "Notificación no encontrada." };
  if (notification.channel !== "EMAIL") return { error: "Solo se pueden reintentar emails." };
  if (notification.status !== "FAILED") {
    return { error: "Solo se pueden reintentar notificaciones fallidas." };
  }
  if (!isTrackableStatus(notification.triggerStatus)) {
    return { error: "La notificación no tiene un estado de pedido válido." };
  }

  const meta = ORDER_STATUS_META[notification.triggerStatus];
  if (!meta.notify) {
    return { error: "Este estado no está configurado para enviar emails." };
  }

  await prisma.notification.update({
    where: { id },
    data: { status: "PENDING", error: null },
  });

  try {
    await notificationSender.sendStatusUpdate({
      to: notification.order.client.email,
      fullName: notification.order.client.fullName,
      orderNumber: formatOrderNumber(notification.order.orderNumber),
      statusLabel: meta.label,
      helpText: meta.help,
      trackingUrl: `${serverEnv.appUrl()}/portal/orders/${notification.order.id}`,
    });
    await prisma.notification.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date(), error: null },
    });
    revalidatePath(`/admin/orders/${notification.orderId}`);
    return { ok: true, message: "Email reenviado correctamente." };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await prisma.notification.update({
      where: { id },
      data: { status: "FAILED", error },
    });
    revalidatePath(`/admin/orders/${notification.orderId}`);
    return { error: `No se pudo reenviar: ${error}` };
  }
}
