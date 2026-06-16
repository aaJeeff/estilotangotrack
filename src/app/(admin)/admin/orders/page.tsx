import Link from "next/link";
import { listOrders } from "@/modules/orders/queries";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { OrderStatusBadge } from "@/shared/ui/order-status-badge";
import { formatCurrency, formatDate, formatOrderNumber } from "@/shared/lib/format";

export const metadata = { title: "Pedidos — Admin" };

export default async function OrdersPage() {
  const orders = await listOrders();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Pedidos</h1>
        <Link href="/admin/orders/new">
          <Button>Nuevo pedido</Button>
        </Link>
      </div>

      <Card>
        {orders.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Todavía no hay pedidos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">N°</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Tracking</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Creado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {formatOrderNumber(o.orderNumber)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{o.client.fullName}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.currentStatus} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {o.shipment?.trackingNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(o.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
