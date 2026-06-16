import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/modules/clients/queries";
import { updateClientAction, setClientActiveAction } from "@/modules/clients/actions";
import { ClientForm } from "@/modules/clients/ui/client-form";
import { ResendInviteButton } from "@/modules/clients/ui/resend-invite-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { OrderStatusBadge } from "@/shared/ui/order-status-badge";
import { formatCurrency, formatDate, formatOrderNumber } from "@/shared/lib/format";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  return (
    <div className="space-y-5">
      <Link href="/admin/clients" className="text-sm text-slate-500 hover:underline">
        ← Volver a clientes
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{client.fullName}</h1>
        <div className="flex items-center gap-3">
          <ResendInviteButton clientId={client.id} />
          <form action={setClientActiveAction}>
            <input type="hidden" name="id" value={client.id} />
            <input type="hidden" name="active" value={(!client.isActive).toString()} />
            <Button type="submit" variant={client.isActive ? "danger" : "secondary"} size="sm">
              {client.isActive ? "Desactivar" : "Activar"}
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos del cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm
              action={updateClientAction}
              submitLabel="Guardar cambios"
              initial={client}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos ({client.orders.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {client.orders.length === 0 ? (
              <p className="text-sm text-slate-500">Este cliente no tiene pedidos.</p>
            ) : (
              client.orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-800">
                    {formatOrderNumber(o.orderNumber)}
                  </span>
                  <OrderStatusBadge status={o.currentStatus} />
                  <span className="text-sm text-slate-500">
                    {formatCurrency(o.totalAmount)}
                  </span>
                  <span className="text-sm text-slate-400">{formatDate(o.createdAt)}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
