"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { requireRole } from "@/shared/lib/auth/session";
import { writeAudit } from "@/modules/audit/audit";
import type { FormState } from "@/shared/types/form";
import { trackingProvider } from "./infrastructure/seventeen-track.adapter";
import { syncShipment } from "./application/sync-shipment";

const assignSchema = z.object({
  orderId: z.string().min(1),
  trackingNumber: z.string().trim().min(5, "Código de seguimiento inválido"),
  carrier: z.string().trim().optional().default(""),
});

export async function assignTrackingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole("ADMIN");
  const parsed = assignSchema.safeParse({
    orderId: formData.get("orderId"),
    trackingNumber: formData.get("trackingNumber"),
    carrier: formData.get("carrier") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { orderId, trackingNumber, carrier } = parsed.data;

  // Guard against assigning a number already used by another order.
  const clash = await prisma.shipment.findUnique({ where: { trackingNumber } });
  if (clash && clash.orderId !== orderId) {
    return { error: "Ese código de seguimiento ya está asignado a otro pedido." };
  }

  let shipment;
  try {
    shipment = await prisma.shipment.upsert({
      where: { orderId },
      update: { trackingNumber, carrier: carrier || null },
      create: {
        orderId,
        trackingNumber,
        carrier: carrier || null,
        syncZone: "CHINA",
        nextSyncAt: new Date(),
      },
    });
  } catch {
    return { error: "No se pudo guardar el código de seguimiento." };
  }

  // Register with the provider (non-fatal if it fails — can retry later).
  let registered = false;
  try {
    await trackingProvider.register(trackingNumber);
    registered = true;
  } catch (err) {
    console.error("[tracking] register failed", err);
  }
  await prisma.shipment.update({
    where: { id: shipment.id },
    data: { registeredWithProvider: registered },
  });

  // Kick off an initial sync.
  const result = await syncShipment(shipment.id);

  await writeAudit({
    userId: admin.id,
    action: "tracking.assign",
    entityType: "Shipment",
    entityId: shipment.id,
    after: { trackingNumber, registered },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/portal/orders");

  if (!registered) {
    return {
      ok: true,
      message:
        "Código guardado. No se pudo registrar en 17Track todavía; reintentá con “Actualizar ahora”.",
    };
  }
  return {
    ok: true,
    message: result.advanced
      ? `Tracking asignado. Estado actualizado.`
      : "Tracking asignado y sincronizado.",
  };
}

export async function syncNowAction(formData: FormData): Promise<FormState> {
  await requireRole("ADMIN");
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return { error: "Pedido no encontrado" };

  const shipment = await prisma.shipment.findUnique({ where: { orderId } });
  if (!shipment) return { error: "Este pedido no tiene un código de seguimiento asignado." };

  const result = await syncShipment(shipment.id);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/portal/orders/${orderId}`);

  if (!result.ok) {
    return { error: `No se pudo actualizar: ${result.error ?? "error desconocido"}` };
  }
  return {
    ok: true,
    message: result.advanced
      ? "Actualizado. El estado del pedido avanzó."
      : result.eventsAdded > 0
        ? `Se registraron ${result.eventsAdded} eventos nuevos.`
        : "Sin novedades por ahora.",
  };
}
