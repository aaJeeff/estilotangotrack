import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { requireUser } from "@/shared/lib/auth/session";
import { listOrdersForClient } from "@/modules/orders/queries";
import { OrderStatusBadge, orderStatusLabel } from "@/shared/ui/order-status-badge";
import { ProgressBar } from "@/modules/portal/ui/progress-bar";
import { statusProgress, statusRank } from "@/shared/config/order-status";
import { formatDate, formatOrderNumber } from "@/shared/lib/format";

export const metadata = { title: "Mis pedidos" };

export default async function PortalOrdersPage() {
  const user = await requireUser();
  const orders = user.clientId ? await listOrdersForClient(user.clientId) : [];
  const activeOrders = orders.filter(
    (order) => order.currentStatus !== "DELIVERED" && order.currentStatus !== "CANCELLED",
  );
  const previousOrders = orders.filter(
    (order) => order.currentStatus === "DELIVERED" || order.currentStatus === "CANCELLED",
  );

  return (
    <div className="orders-page">
      <header className="orders-heading">
        <div>
          <p className="portal-eyebrow">Tu cuenta</p>
          <h1 className="portal-title">Mis pedidos</h1>
          <p className="portal-subtitle">Seguí el viaje de tus camisetas desde un solo lugar.</p>
        </div>
        {orders.length > 0 && (
          <div className="orders-summary" aria-label="Resumen de pedidos">
            <span>{activeOrders.length} en curso</span>
            <span>{previousOrders.length} anteriores</span>
          </div>
        )}
      </header>

      <section className="orders-wallet liquid-panel">
        {orders.length === 0 ? (
          <div className="orders-empty">
            <p className="portal-eyebrow">Sin pedidos todavía</p>
            <p>
              Cuando confirmemos tu pedido, vas a poder seguir cada etapa de su recorrido desde
              acá.
            </p>
          </div>
        ) : (
          <>
            {activeOrders.length > 0 && (
              <div className="orders-group">
                <h2 className="orders-section-label">En curso</h2>
                <div className="orders-active-list">
                  {activeOrders.map((order) => (
                    <ActiveOrderTicket key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}

            {previousOrders.length > 0 && (
              <div className="orders-group orders-group--previous">
                <h2 className="orders-section-label">Anteriores</h2>
                <div className="orders-previous-list">
                  {previousOrders.map((order) => (
                    <PreviousOrderTicket key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

type PortalOrder = Awaited<ReturnType<typeof listOrdersForClient>>[number];

function ActiveOrderTicket({ order }: { order: PortalOrder }) {
  const progress = statusProgress(order.currentStatus);
  const route = routeForStatus(order.currentStatus);

  return (
    <Link href={`/portal/orders/${order.id}`} className="order-ticket-link">
      <article className="order-ticket">
        <div className="order-ticket-main">
          <div className="order-ticket-top">
            <span>Pedido {formatOrderNumber(order.orderNumber)}</span>
            <OrderStatusBadge status={order.currentStatus} appearance="portal" />
          </div>

          <div className="order-route">
            <div className="order-place">
              <small>Origen</small>
              <strong>{route.origin}</strong>
              <span>{route.originDetail}</span>
            </div>
            <span className="order-route-icon" aria-hidden>→</span>
            <div className="order-place order-place--destination">
              <small>Destino</small>
              <strong>{route.destination}</strong>
              <span>{route.destinationDetail}</span>
            </div>
          </div>

          <div className="order-ticket-progress">
            <span className="order-ticket-percent">{progress}%</span>
            <div>
              <div className="order-progress-copy">
                <span>Progreso del pedido</span>
                <span>{orderStatusLabel(order.currentStatus)}</span>
              </div>
              <ProgressBar progress={progress} showLabel={false} />
            </div>
          </div>
        </div>

        <footer className="order-ticket-footer">
          <div>
            <small>Contenido</small>
            <strong>{itemCount(order._count.items)}</strong>
          </div>
          <div>
            <small>Entrega estimada</small>
            <strong>{estimatedRange(order)}</strong>
          </div>
          <span className="order-ticket-action">Ver seguimiento <span aria-hidden>→</span></span>
        </footer>
      </article>
    </Link>
  );
}

function PreviousOrderTicket({ order }: { order: PortalOrder }) {
  const progress = statusProgress(order.currentStatus);

  return (
    <Link href={`/portal/orders/${order.id}`} className="order-ticket-link">
      <article className="order-ticket-previous">
        <div className="order-previous-head">
          <strong>Pedido {formatOrderNumber(order.orderNumber)}</strong>
          <OrderStatusBadge status={order.currentStatus} appearance="portal" />
        </div>
        <p>Guangzhou → Rosario</p>
        <ProgressBar progress={progress} showLabel={false} />
        <div className="order-previous-meta">
          <span>{itemCount(order._count.items)}</span>
          <span>{previousDate(order)}</span>
        </div>
      </article>
    </Link>
  );
}

function routeForStatus(status: OrderStatus) {
  if (statusRank(status) >= statusRank("ARRIVED_ARGENTINA")) {
    return {
      origin: "Buenos Aires",
      originDetail: "Argentina",
      destination: "Rosario",
      destinationDetail: "Santa Fe",
    };
  }

  return {
    origin: "Guangzhou",
    originDetail: "China",
    destination: "Buenos Aires",
    destinationDetail: "Argentina",
  };
}

function itemCount(count: number) {
  return `${count} ${count === 1 ? "camiseta" : "camisetas"}`;
}

function estimatedRange(order: PortalOrder) {
  if (order.estimatedDeliveryFrom && order.estimatedDeliveryTo) {
    return `${formatDate(order.estimatedDeliveryFrom)} – ${formatDate(order.estimatedDeliveryTo)}`;
  }
  if (order.estimatedDeliveryTo) return formatDate(order.estimatedDeliveryTo);
  if (order.estimatedDeliveryFrom) return `Desde ${formatDate(order.estimatedDeliveryFrom)}`;
  return "A confirmar";
}

function previousDate(order: PortalOrder) {
  if (order.actualDeliveryDate) return `Entregado el ${formatDate(order.actualDeliveryDate)}`;
  if (order.currentStatus === "CANCELLED") return "Pedido cancelado";
  return formatDate(order.createdAt);
}
