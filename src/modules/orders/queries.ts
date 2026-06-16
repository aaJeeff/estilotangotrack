import "server-only";
import { prisma } from "@/shared/lib/prisma";

export async function listOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, fullName: true } },
      shipment: { select: { trackingNumber: true } },
      _count: { select: { items: true } },
    },
  });
}

/** Full order detail for the admin. */
export async function getOrderAdmin(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      items: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
      shipment: { include: { events: { orderBy: { occurredAt: "desc" } } } },
      statusHistory: { orderBy: { enteredAt: "asc" } },
      notifications: { orderBy: { createdAt: "desc" } },
    },
  });
}

/** Orders belonging to a client (portal list). */
export async function listOrdersForClient(clientId: string) {
  return prisma.order.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      currentStatus: true,
      createdAt: true,
      estimatedDeliveryFrom: true,
      estimatedDeliveryTo: true,
      _count: { select: { items: true } },
    },
  });
}

/**
 * Order detail for the portal. Deliberately excludes internal notes, raw
 * tracking events and owner contact info — only client-safe data.
 */
export async function getOrderForClient(id: string, clientId: string) {
  return prisma.order.findFirst({
    where: { id, clientId },
    select: {
      id: true,
      orderNumber: true,
      currentStatus: true,
      createdAt: true,
      confirmedAt: true,
      estimatedDeliveryFrom: true,
      estimatedDeliveryTo: true,
      actualDeliveryDate: true,
      totalAmount: true,
      depositAmount: true,
      balanceAmount: true,
      paymentStatus: true,
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productName: true,
          size: true,
          version: true,
          printName: true,
          printNumber: true,
          patches: true,
          quantity: true,
        },
      },
      statusHistory: {
        orderBy: { enteredAt: "asc" },
        select: { status: true, enteredAt: true },
      },
      shipment: { select: { trackingNumber: true } },
    },
  });
}
