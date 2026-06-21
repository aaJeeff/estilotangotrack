import { notFound } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { requireOrderAccess, requireUser } from "@/shared/lib/auth/session";
import { getOrderForClient } from "@/modules/orders/queries";
import { TrackingExperience } from "@/modules/portal/tracking/tracking-experience";
import type {
  TrackingExperienceData,
  TrackingTimelineEntry,
} from "@/modules/portal/tracking/tracking-types";
import {
  ORDER_STATUS_META,
  statusProgress,
  type TrackableStatus,
} from "@/shared/config/order-status";
import {
  TRACKING_STEPS,
  trackingStepForStatus,
} from "@/modules/portal/tracking/tracking-state";
import { orderStatusLabel } from "@/shared/ui/order-status-badge";
import { formatCurrency, formatDate, formatOrderNumber } from "@/shared/lib/format";

export const metadata = { title: "Seguimiento del pedido" };

export default async function PortalOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOrderAccess(id);
  const user = await requireUser();
  const order = user.clientId ? await getOrderForClient(id, user.clientId) : null;
  if (!order) notFound();

  const data = toTrackingExperienceData(order);

  return <TrackingExperience data={data} />;
}

type PortalOrder = NonNullable<Awaited<ReturnType<typeof getOrderForClient>>>;

function toTrackingExperienceData(order: PortalOrder): TrackingExperienceData {
  const status = order.currentStatus;
  const isCancelled = status === "CANCELLED";
  const meta = isCancelled ? null : ORDER_STATUS_META[status as TrackableStatus];

  return {
    orderNumber: formatOrderNumber(order.orderNumber),
    status,
    statusLabel: orderStatusLabel(status),
    statusHelp:
      meta?.help ??
      "Este pedido fue cancelado. Si necesitás más información, comunicate con nosotros.",
    progress: statusProgress(status),
    estimatedTitle: estimatedTitle(status),
    estimatedDate: estimatedDate(order),
    timeline: buildTimeline(order),
    products: order.items.map((item) => ({
      id: item.id,
      name: item.productName,
      marker: item.printNumber || String(item.quantity),
      meta: [
        `Talle ${item.size}`,
        item.version,
        [item.printName, item.printNumber].filter(Boolean).join(" "),
        item.quantity > 1 ? `x${item.quantity}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    })),
    summary: [
      { label: "Total", value: formatCurrency(order.totalAmount) },
      {
        label: "Seña abonada",
        value: Number(order.depositAmount) > 0 ? "Confirmada" : "Pendiente",
        state: Number(order.depositAmount) > 0 ? "complete" : "pending",
      },
      { label: "Saldo pendiente", value: formatCurrency(order.balanceAmount) },
    ],
  };
}

function buildTimeline(order: PortalOrder): TrackingTimelineEntry[] {
  const latestDate = new Map<OrderStatus, Date>();
  order.statusHistory.forEach((entry) => latestDate.set(entry.status, entry.enteredAt));
  const currentStep = trackingStepForStatus(order.currentStatus);
  const currentRank = TRACKING_STEPS.findIndex((entry) => entry.id === currentStep);
  const historicalRank = Math.max(
    -1,
    ...order.statusHistory
      .filter((entry) => entry.status !== "CANCELLED")
      .map((entry) => {
        const step = trackingStepForStatus(entry.status);
        return TRACKING_STEPS.findIndex((candidate) => candidate.id === step);
      }),
  );

  const sequenceEntries = TRACKING_STEPS.map((step, index) => {
    const date = timelineDateForStep(step.id, latestDate);
    return {
      id: step.id,
      label: step.label,
      date: date ? formatDate(date) : index < currentRank ? "Completado" : "Pendiente",
      state:
        index < currentRank
          ? ("done" as const)
          : index === currentRank
            ? ("current" as const)
            : ("pending" as const),
    };
  });

  if (order.currentStatus !== "CANCELLED") return sequenceEntries;
  const cancelledDate = latestDate.get("CANCELLED") ?? order.createdAt;
  return [
    ...sequenceEntries
      .filter((_, index) => index <= historicalRank)
      .map((entry) => ({ ...entry, state: "done" as const })),
    {
      id: "CANCELLED",
      status: "CANCELLED" as const,
      label: orderStatusLabel("CANCELLED"),
      date: formatDate(cancelledDate),
      state: "current" as const,
    },
  ];
}

function timelineDateForStep(
  step: (typeof TRACKING_STEPS)[number]["id"],
  dates: Map<OrderStatus, Date>,
) {
  switch (step) {
    case "confirmed":
      return dates.get("CONFIRMED");
    case "preparing":
    case "international":
      return dates.get("DISPATCHED_CHINA");
    case "customs":
      return (
        dates.get("DECLARED") ??
        dates.get("CUSTOMS_PROCESSING") ??
        dates.get("ARRIVED_ARGENTINA")
      );
    case "to-rosario":
      return dates.get("EN_ROUTE_ROSARIO");
    case "distribution":
      return dates.get("RECEIVED_BY_US");
    case "delivered":
      return dates.get("DELIVERED");
  }
}

function estimatedTitle(status: OrderStatus) {
  if (status === "DELIVERED") return "Entrega completada";
  if (status === "RECEIVED_BY_US") return "Coordinación de entrega final";
  if (status === "EN_ROUTE_ROSARIO") return "Estimado de llegada a Rosario";
  if (status === "CANCELLED") return "Sin entrega estimada";
  return "Estimado desde el despacho internacional";
}

function estimatedDate(order: PortalOrder) {
  if (order.actualDeliveryDate) return formatDate(order.actualDeliveryDate);
  if (order.currentStatus === "CANCELLED") return "Pedido cancelado";
  if (order.estimatedDeliveryFrom && order.estimatedDeliveryTo) {
    return `${formatDate(order.estimatedDeliveryFrom)} – ${formatDate(order.estimatedDeliveryTo)}`;
  }
  if (order.estimatedDeliveryTo) return formatDate(order.estimatedDeliveryTo);
  if (order.estimatedDeliveryFrom) return `Desde ${formatDate(order.estimatedDeliveryFrom)}`;
  return "A confirmar";
}
