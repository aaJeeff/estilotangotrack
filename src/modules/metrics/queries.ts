import "server-only";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";

export interface DashboardMetrics {
  activeOrders: number;
  inChina: number;
  inCustoms: number;
  inRosario: number;
  delivered: number;
  activeClients: number;
  totalBilled: number;
  depositsCollected: number;
  pendingBalance: number;
  byStatus: { status: OrderStatus; label: string; count: number }[];
}

const GROUPS = {
  inChina: ["CONFIRMED", "DISPATCHED_CHINA"] as OrderStatus[],
  inCustoms: ["ARRIVED_ARGENTINA", "CUSTOMS_PROCESSING", "DECLARED"] as OrderStatus[],
  inRosario: ["EN_ROUTE_ROSARIO", "RECEIVED_BY_US"] as OrderStatus[],
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [grouped, totals, deposits, activeClients] = await Promise.all([
    prisma.order.groupBy({
      by: ["currentStatus"],
      _count: { _all: true },
      where: { archivedAt: null },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true, balanceAmount: true },
      where: { currentStatus: { not: "CANCELLED" } },
    }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { type: "DEPOSIT" } }),
    prisma.client.count({ where: { isActive: true } }),
  ]);

  const counts = new Map<OrderStatus, number>();
  for (const g of grouped) counts.set(g.currentStatus, g._count._all);

  const sum = (statuses: OrderStatus[]) =>
    statuses.reduce((acc, s) => acc + (counts.get(s) ?? 0), 0);

  const inChina = sum(GROUPS.inChina);
  const inCustoms = sum(GROUPS.inCustoms);
  const inRosario = sum(GROUPS.inRosario);
  const delivered = counts.get("DELIVERED") ?? 0;

  return {
    activeOrders: inChina + inCustoms + inRosario,
    inChina,
    inCustoms,
    inRosario,
    delivered,
    activeClients,
    totalBilled: Number(totals._sum.totalAmount ?? 0),
    depositsCollected: Number(deposits._sum.amount ?? 0),
    pendingBalance: Number(totals._sum.balanceAmount ?? 0),
    byStatus: [
      { status: "CONFIRMED" as OrderStatus, label: "En China", count: inChina },
      { status: "CUSTOMS_PROCESSING" as OrderStatus, label: "En aduana", count: inCustoms },
      { status: "EN_ROUTE_ROSARIO" as OrderStatus, label: "En Rosario", count: inRosario },
      { status: "DELIVERED" as OrderStatus, label: "Entregados", count: delivered },
    ],
  };
}
