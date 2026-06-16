import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderAdmin } from "@/modules/orders/queries";
import { setOrderStatusAction, archiveOrderAction } from "@/modules/orders/actions";
import { AssignTrackingForm } from "@/modules/orders/ui/assign-tracking-form";
import { SyncNowButton } from "@/modules/orders/ui/sync-now-button";
import { AddPaymentForm } from "@/modules/orders/ui/add-payment-form";
import { OrderDetailsForm } from "@/modules/orders/ui/order-details-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { OrderStatusBadge, orderStatusLabel } from "@/shared/ui/order-status-badge";
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  PAYMENT_TYPE_LABEL,
} from "@/shared/config/payment-status";
import { ORDER_STATUS_SEQUENCE } from "@/shared/config/order-status";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatOrderNumber,
} from "@/shared/lib/format";

const ALL_STATUSES = [...ORDER_STATUS_SEQUENCE, "CANCELLED"] as const;

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderAdmin(id);
  if (!order) notFound();

  return (
    <div className="space-y-5">
      <Link href="/admin/orders" className="text-sm text-slate-500 hover:underline">
        ← Volver a pedidos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">
            Pedido {formatOrderNumber(order.orderNumber)}
          </h1>
          <OrderStatusBadge status={order.currentStatus} />
          {order.archivedAt && <Badge tone="neutral">Archivado</Badge>}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href={`/admin/clients/${order.client.id}`} className="hover:underline">
            {order.client.fullName}
          </Link>
          <span>·</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Camisetas ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((it) => (
                <div key={it.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      {it.productName} · Talle {it.size}
                      {it.quantity > 1 && ` · x${it.quantity}`}
                    </span>
                    <span className="text-slate-600">{formatCurrency(it.unitPrice)}</span>
                  </div>
                  <div className="mt-1 text-slate-500">
                    {[
                      it.version && `Versión: ${it.version}`,
                      it.printName && `Estampado: ${it.printName}`,
                      it.printNumber && `N°: ${it.printNumber}`,
                      it.patches && `Parches: ${it.patches}`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Sin detalles adicionales"}
                  </div>
                  {(it.ownerName || it.ownerContact) && (
                    <div className="mt-1 text-xs text-slate-400">
                      Propietario: {it.ownerName} {it.ownerContact && `(${it.ownerContact})`}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de estados</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {order.statusHistory.map((h) => (
                  <li key={h.id} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {orderStatusLabel(h.status)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(h.enteredAt)} ·{" "}
                        {h.source === "AUTO_TRANSLATED" ? "Automático" : "Manual"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Internal details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle y observaciones internas</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderDetailsForm
                orderId={order.id}
                totalAmount={order.totalAmount.toString()}
                internalNotes={order.internalNotes ?? ""}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Status control */}
          <Card>
            <CardHeader>
              <CardTitle>Cambiar estado</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={setOrderStatusAction} className="space-y-3">
                <input type="hidden" name="orderId" value={order.id} />
                <select
                  name="status"
                  defaultValue={order.currentStatus}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {orderStatusLabel(s)}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" className="w-full">
                  Actualizar estado
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Seguimiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.shipment ? (
                <div className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-mono text-slate-800">{order.shipment.trackingNumber}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {order.shipment.registeredWithProvider
                      ? "Registrado en 17Track"
                      : "No registrado en 17Track"}
                    {order.shipment.lastSyncedAt &&
                      ` · Últ. sync ${formatDateTime(order.shipment.lastSyncedAt)}`}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Sin código de seguimiento asignado.</p>
              )}
              {order.shipment && <SyncNowButton orderId={order.id} />}
              <div className="border-t border-slate-100 pt-3">
                <AssignTrackingForm
                  orderId={order.id}
                  currentNumber={order.shipment?.trackingNumber}
                  currentCarrier={order.shipment?.carrier}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Pagos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <Row label="Total" value={formatCurrency(order.totalAmount)} />
                <Row label="Seña abonada" value={formatCurrency(order.depositAmount)} />
                <Row label="Saldo pendiente" value={formatCurrency(order.balanceAmount)} />
                <div className="mt-2">
                  <Badge tone={PAYMENT_STATUS_TONE[order.paymentStatus]}>
                    {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                  </Badge>
                </div>
              </div>

              {order.payments.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {order.payments.map((p) => (
                    <li key={p.id} className="flex justify-between text-slate-600">
                      <span>
                        {PAYMENT_TYPE_LABEL[p.type]} · {PAYMENT_METHOD_LABEL[p.method]}
                      </span>
                      <span>{formatCurrency(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-t border-slate-100 pt-3">
                <AddPaymentForm orderId={order.id} />
              </div>
            </CardContent>
          </Card>

          {/* Archive */}
          <form action={archiveOrderAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input
              type="hidden"
              name="archived"
              value={(!order.archivedAt).toString()}
            />
            <Button type="submit" variant="ghost" size="sm" className="w-full">
              {order.archivedAt ? "Desarchivar pedido" : "Archivar pedido"}
            </Button>
          </form>
        </div>
      </div>
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
