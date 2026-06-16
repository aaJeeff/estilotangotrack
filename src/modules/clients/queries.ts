import "server-only";
import { prisma } from "@/shared/lib/prisma";

export async function listClients() {
  return prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
    },
  });
}

export async function getClient(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          currentStatus: true,
          totalAmount: true,
          createdAt: true,
        },
      },
    },
  });
}

/** Lightweight list for select inputs (e.g. when creating an order). */
export async function listActiveClientsForSelect() {
  return prisma.client.findMany({
    where: { isActive: true },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, email: true },
  });
}
