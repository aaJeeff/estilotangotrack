"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays } from "date-fns";
import { z } from "zod";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import { requireRole } from "@/shared/lib/auth/session";
import { writeAudit } from "@/modules/audit/audit";
import { notifyStatusChange } from "@/modules/notifications/send";
import {
  ESTIMATED_DELIVERY_DAYS,
  ORDER_STATUS_META,
  ORDER_STATUS_SEQUENCE,
  type TrackableStatus,
} from "@/shared/config/order-status";
import type { FormState } from "@/shared/types/form";
import { computeBalance, computePaymentStatus } from "./domain/payment";
import { nextOrderNumber } from "./order-number";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recompute the Order payment snapshot from its Payment ledger. */
async function recomputePayments(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { totalAmount: true },
  });
  const payments = await tx.payment.findMany({
    where: { orderId },
    select: { type: true, amount: true },
  });

  const total = Number(order.totalAmount);
  const paidSum = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const depositSum = payments
    .filter((p) => p.type === "DEPOSIT")
    .reduce((acc, p) => acc + Number(p.amount), 0);

  await tx.order.update({
    where: { id: orderId },
    data: {
      depositAmount: depositSum,
      balanceAmount: computeBalance(total, paidSum),
      paymentStatus: computePaymentStatus(total, paidSum),
    },
  });
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

const itemSchema = z.object({
  productName: z.string().trim().min(1, "Producto requerido"),
  size: z.string().trim().min(1, "Talle requerido"),
  version: z.string().trim().optional().default(""),
  printName: z.string().trim().optional().default(""),
  printNumber: z.string().trim().optional().default(""),
  patches: z.string().trim().optional().default(""),
  unitPrice: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(1),
  ownerName: z.string().trim().optional().default(""),
  ownerContact: z.string().trim().optional().default(""),
});

const createSchema = z.object({
  clientId: z.string().min(1, "Elegí un cliente"),
  totalAmount: z.coerce.number().min(0),
  depositAmount: z.coerce.number().min(0),
  depositMethod: z.enum(["CASH", "TRANSFER", "MERCADO_PAGO", "OTHER"]).default("CASH"),
  internalNotes: z.string().trim().optional().default(""),
});

export async function createOrderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const base = createSchema.safeParse({
    clientId: formData.get("clientId"),
    totalAmount: formData.get("totalAmount"),
    depositAmount: formData.get("depositAmount"),
    depositMethod: formData.get("depositMethod") ?? "CASH",
    internalNotes: formData.get("internalNotes") ?? "",
  });
  if (!base.success) {
    return { error: base.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let items: z.infer<typeof itemSchema>[];
  try {
    const raw = JSON.parse(String(formData.get("items") ?? "[]"));
    items = z.array(itemSchema).min(1, "Agregá al menos una camiseta").parse(raw);
  } catch (err) {
    return {
      error:
        err instanceof z.ZodError
          ? err.issues[0]?.message ?? "Camisetas inválidas"
          : "Camisetas inválidas",
    };
  }

  const input = base.data;
  const now = new Date();

  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = await nextOrderNumber(tx);
    const created = await tx.order.create({
      data: {
        orderNumber,
        clientId: input.clientId,
        currentStatus: "CONFIRMED",
        internalNotes: input.internalNotes || null,
        totalAmount: input.totalAmount,
        estimatedDeliveryFrom: addDays(now, ESTIMATED_DELIVERY_DAYS.min),
        estimatedDeliveryTo: addDays(now, ESTIMATED_DELIVERY_DAYS.max),
        items: {
          create: items.map((i) => ({
            productName: i.productName,
            size: i.size,
            version: i.version || null,
            printName: i.printName || null,
            printNumber: i.printNumber || null,
            patches: i.patches || null,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            ownerName: i.ownerName || null,
            ownerContact: i.ownerContact || null,
          })),
        },
        statusHistory: {
          create: { status: "CONFIRMED", source: "MANUAL", changedByUserId: admin.id },
        },
      },
    });

    if (input.depositAmount > 0) {
      await tx.payment.create({
        data: {
          orderId: created.id,
          type: "DEPOSIT",
          amount: input.depositAmount,
          method: input.depositMethod,
          recordedByUserId: admin.id,
        },
      });
    }

    await recomputePayments(tx, created.id);
    return created;
  });

  await writeAudit({
    userId: admin.id,
    action: "order.create",
    entityType: "Order",
    entityId: order.id,
    after: { orderNumber: order.orderNumber, clientId: input.clientId },
  });

  revalidatePath("/admin/orders");
  redirect(`/admin/orders/${order.id}`);
}

// ---------------------------------------------------------------------------
// Update details
// ---------------------------------------------------------------------------

const updateSchema = z.object({
  id: z.string().min(1),
  totalAmount: z.coerce.number().min(0),
  internalNotes: z.string().trim().optional().default(""),
});

export async function updateOrderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole("ADMIN");
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    totalAmount: formData.get("totalAmount"),
    internalNotes: formData.get("internalNotes") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: parsed.data.id },
      data: {
        totalAmount: parsed.data.totalAmount,
        internalNotes: parsed.data.internalNotes || null,
      },
    });
    await recomputePayments(tx, parsed.data.id);
  });

  await writeAudit({
    userId: admin.id,
    action: "order.update",
    entityType: "Order",
    entityId: parsed.data.id,
    after: { totalAmount: parsed.data.totalAmount },
  });

  revalidatePath(`/admin/orders/${parsed.data.id}`);
  return { ok: true, message: "Pedido actualizado." };
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

const paymentSchema = z.object({
  orderId: z.string().min(1),
  type: z.enum(["DEPOSIT", "BALANCE", "ADJUSTMENT"]),
  amount: z.coerce.number(),
  method: z.enum(["CASH", "TRANSFER", "MERCADO_PAGO", "OTHER"]).default("CASH"),
  notes: z.string().trim().optional().default(""),
});

export async function addPaymentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole("ADMIN");
  const parsed = paymentSchema.safeParse({
    orderId: formData.get("orderId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    method: formData.get("method") ?? "CASH",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const input = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        orderId: input.orderId,
        type: input.type,
        amount: input.amount,
        method: input.method,
        notes: input.notes || null,
        recordedByUserId: admin.id,
      },
    });
    await recomputePayments(tx, input.orderId);
  });

  await writeAudit({
    userId: admin.id,
    action: "order.add_payment",
    entityType: "Order",
    entityId: input.orderId,
    after: { type: input.type, amount: input.amount },
  });

  revalidatePath(`/admin/orders/${input.orderId}`);
  return { ok: true, message: "Pago registrado." };
}

// ---------------------------------------------------------------------------
// Manual status change
// ---------------------------------------------------------------------------

const ALL_STATUSES = [...ORDER_STATUS_SEQUENCE, "CANCELLED"] as const;

export async function setOrderStatusAction(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!orderId || !ALL_STATUSES.includes(status as (typeof ALL_STATUSES)[number])) return;

  const before = await prisma.order.findUnique({
    where: { id: orderId },
    select: { currentStatus: true },
  });
  if (!before) return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        currentStatus: status,
        actualDeliveryDate: status === "DELIVERED" ? new Date() : undefined,
        cancelledAt: status === "CANCELLED" ? new Date() : undefined,
      },
    });
    await tx.orderStatusHistory.create({
      data: { orderId, status, source: "MANUAL", changedByUserId: admin.id },
    });
  });

  await writeAudit({
    userId: admin.id,
    action: "order.set_status",
    entityType: "Order",
    entityId: orderId,
    before: { status: before.currentStatus },
    after: { status },
  });

  // Fire client email if this is a notify status (deduped internally).
  if (status !== "CANCELLED" && ORDER_STATUS_META[status as TrackableStatus]?.notify) {
    await notifyStatusChange(orderId, status as TrackableStatus);
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/portal/orders");
}

export async function archiveOrderAction(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const orderId = String(formData.get("orderId") ?? "");
  const archived = formData.get("archived") === "true";
  if (!orderId) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { archivedAt: archived ? new Date() : null },
  });

  await writeAudit({
    userId: admin.id,
    action: archived ? "order.archive" : "order.unarchive",
    entityType: "Order",
    entityId: orderId,
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
