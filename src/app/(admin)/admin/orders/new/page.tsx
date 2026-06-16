import Link from "next/link";
import { listActiveClientsForSelect } from "@/modules/clients/queries";
import { OrderForm } from "@/modules/orders/ui/order-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

export const metadata = { title: "Nuevo pedido — Admin" };

export default async function NewOrderPage() {
  const clients = await listActiveClientsForSelect();

  if (clients.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Card>
          <CardContent className="space-y-3 text-center">
            <p className="text-sm text-slate-600">
              Necesitás al menos un cliente activo para crear un pedido.
            </p>
            <Link href="/admin/clients/new">
              <Button>Crear cliente</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/admin/orders" className="text-sm text-slate-500 hover:underline">
        ← Volver a pedidos
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Nuevo pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderForm clients={clients} />
        </CardContent>
      </Card>
    </div>
  );
}
