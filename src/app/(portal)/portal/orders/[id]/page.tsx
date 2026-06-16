import Link from "next/link";
import { notFound } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import { requireOrderAccess, requireUser } from "@/shared/lib/auth/session";
import { getOrderForClient } from "@/modules/orders/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Accordion } from "@/shared/ui/accordion";
import { OrderStatusBadge, orderStatusLabel } from "@/shared/ui/order-status-badge";
import { ShipmentMap } from "@/shared/maps/shipment-map";
import { ProgressBar } from "@/modules/portal/ui/progress-bar";
import { ClientTimeline } from "@/modules/portal/ui/client-timeline";
import {
  ESTIMATED_DELIVERY_DAYS,
  ORDER_STATUS_META,
  statusProgress,
  type TrackableStatus,
} from "@/shared/config/order-status";
import {
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
} from "@/shared/config/payment-status";
import { formatCurrency, formatDate, formatOrderNumber } from "@/shared/lib/format";

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

  const status = order.currentStatus;
  const progress = statusProgress(status);
  const isCancelled = status === "CANCELLED";
  const meta = isCancelled ? null : ORDER_STATUS_META[status as TrackableStatus];

  const daysRemaining = order.estimatedDeliveryTo
    ? Math.max(0, differenceInCalendarDays(order.estimatedDeliveryTo, new Date()))
    : null;

  return (
    <div className="space-y-5">
      <Link href="/portal/orders" className="text-sm text-slate-500 hover:underline">
        ← Mis pedidos
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          Pedido {formatOrderNumber(order.orderNumber)}
        </h1>
        <OrderStatusBadge status={status} />
      </div>

      {isCancelled ? (
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">
              Este pedido fue cancelado. Si tenés dudas, escribinos por Instagram.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Map */}
          {meta && <ShipmentMap progress={progress} phase={meta.phase} />}

          {/* Current status + progress */}
          <Card>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Estado actual
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {orderStatusLabel(status)}
                </p>
              </div>
              <ProgressBar progress={progress} />
            </CardContent>
          </Card>

          {/* Estimated time */}
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium text-slate-800">Tiempo estimado habitual</p>
                <p className="text-slate-500">
                  {ESTIMATED_DELIVERY_DAYS.min} a {ESTIMATED_DELIVERY_DAYS.max} días
                </p>
              </div>
              {daysRemaining !== null && (
                <div className="text-right">
                  <p className="font-medium text-slate-800">
                    {daysRemaining > 0 ? `~${daysRemaining} días` : "¡Muy pronto!"}
                  </p>
                  <p className="text-slate-500">tiempo restante estimado</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contextual help */}
          {meta && (
            <Accordion title="¿Qué significa este estado?" defaultOpen>
              {meta.help}
            </Accordion>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Seguimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientTimeline history={order.statusHistory} />
            </CardContent>
          </Card>
        </>
      )}

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Tu pedido ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.items.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
            >
              <span className="text-slate-800">
                {it.productName} · Talle {it.size}
                {it.quantity > 1 && ` · x${it.quantity}`}
              </span>
              <span className="text-slate-400">
                {[it.printName, it.printNumber].filter(Boolean).join(" ")}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Economic summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row label="Número de pedido" value={formatOrderNumber(order.orderNumber)} />
          <Row label="Fecha de creación" value={formatDate(order.createdAt)} />
          <Row label="Total" value={formatCurrency(order.totalAmount)} />
          <Row label="Seña abonada" value={formatCurrency(order.depositAmount)} />
          <Row label="Saldo pendiente" value={formatCurrency(order.balanceAmount)} />
          <div className="pt-2">
            <Badge tone={PAYMENT_STATUS_TONE[order.paymentStatus]}>
              {PAYMENT_STATUS_LABEL[order.paymentStatus]}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
