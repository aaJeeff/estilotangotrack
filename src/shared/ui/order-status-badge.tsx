import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_META } from "@/shared/config/order-status";
import { Badge } from "./badge";

type Tone = "neutral" | "blue" | "amber" | "green" | "red" | "violet";

const TONE: Record<OrderStatus, Tone> = {
  CONFIRMED: "neutral",
  DISPATCHED_CHINA: "blue",
  ARRIVED_ARGENTINA: "blue",
  CUSTOMS_PROCESSING: "amber",
  DECLARED: "amber",
  EN_ROUTE_ROSARIO: "violet",
  RECEIVED_BY_US: "violet",
  DELIVERED: "green",
  CANCELLED: "red",
};

export function orderStatusLabel(status: OrderStatus): string {
  if (status === "CANCELLED") return "Cancelado";
  return ORDER_STATUS_META[status].label;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status]}>{orderStatusLabel(status)}</Badge>;
}
