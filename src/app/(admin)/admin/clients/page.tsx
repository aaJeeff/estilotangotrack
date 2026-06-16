import Link from "next/link";
import { listClients } from "@/modules/clients/queries";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { formatDate } from "@/shared/lib/format";

export const metadata = { title: "Clientes — Admin" };

export default async function ClientsPage() {
  const clients = await listClients();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Clientes</h1>
        <Link href="/admin/clients/new">
          <Button>Nuevo cliente</Button>
        </Link>
      </div>

      <Card>
        {clients.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Todavía no hay clientes cargados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Pedidos</th>
                  <th className="px-4 py-3 font-medium">Alta</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/clients/${c.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {c.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.email}</td>
                    <td className="px-4 py-3 text-slate-600">{c._count.orders}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={c.isActive ? "green" : "neutral"}>
                        {c.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
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
