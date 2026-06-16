import { getDashboardMetrics } from "@/modules/metrics/queries";
import { StatusChart } from "@/modules/metrics/ui/status-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { formatCurrency } from "@/shared/lib/format";

export const metadata = { title: "Panel — Admin" };

export default async function DashboardPage() {
  const m = await getDashboardMetrics();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Panel</h1>

      {/* Operational stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Pedidos activos" value={m.activeOrders} />
        <Stat label="En China" value={m.inChina} />
        <Stat label="En aduana" value={m.inCustoms} />
        <Stat label="En Rosario" value={m.inRosario} />
        <Stat label="Entregados" value={m.delivered} />
      </div>

      {/* Financial stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Clientes activos" value={m.activeClients} />
        <Stat label="Total facturado" value={formatCurrency(m.totalBilled)} />
        <Stat label="Señas cobradas" value={formatCurrency(m.depositsCollected)} />
        <Stat label="Saldo pendiente" value={formatCurrency(m.pendingBalance)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos por etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusChart data={m.byStatus} />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}
