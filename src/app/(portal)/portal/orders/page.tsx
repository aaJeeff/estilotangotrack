import Link from "next/link";
import { requireUser } from "@/shared/lib/auth/session";
import { listOrdersForClient } from "@/modules/orders/queries";
import { Card, CardContent } from "@/shared/ui/card";
import { OrderStatusBadge } from "@/shared/ui/order-status-badge";
import { ProgressBar } from "@/modules/portal/ui/progress-bar";
import { statusProgress } from "@/shared/config/order-status";
import { formatOrderNumber } from "@/shared/lib/format";

export const metadata = { title: "Mis pedidos" };

export default async function PortalOrdersPage() {
  const user = await requireUser();
  const orders = user.clientId ? await listOrdersForClient(user.clientId) : [];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-900">Mis pedidos</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500">
              Todavía no tenés pedidos cargados. Cuando confirmemos tu pedido, vas a poder
              seguirlo desde acá.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link key={o.id} href={`/portal/orders/${o.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      Pedido {formatOrderNumber(o.orderNumber)}
                    </span>
                    <OrderStatusBadge status={o.currentStatus} />
                  </div>
                  <ProgressBar progress={statusProgress(o.currentStatus)} />
                  <p className="text-xs text-slate-400">
                    {o._count.items} {o._count.items === 1 ? "camiseta" : "camisetas"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
