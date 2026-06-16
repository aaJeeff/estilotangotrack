import "server-only";
import type { Prisma } from "@prisma/client";

/** Next human-readable order number. Call inside a transaction. */
export async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<number> {
  const last = await tx.order.findFirst({
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  return (last?.orderNumber ?? 0) + 1;
}
