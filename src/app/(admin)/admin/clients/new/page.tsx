import Link from "next/link";
import { createClientAction } from "@/modules/clients/actions";
import { ClientForm } from "@/modules/clients/ui/client-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export const metadata = { title: "Nuevo cliente — Admin" };

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/admin/clients" className="text-sm text-slate-500 hover:underline">
        ← Volver a clientes
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Nuevo cliente</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Al crear el cliente, le enviaremos un email para que defina su contraseña.
          </p>
        </CardHeader>
        <CardContent>
          <ClientForm action={createClientAction} submitLabel="Crear cliente e invitar" />
        </CardContent>
      </Card>
    </div>
  );
}
