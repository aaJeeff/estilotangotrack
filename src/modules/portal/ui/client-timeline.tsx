import type { OrderStatus } from "@prisma/client";
import { orderStatusLabel } from "@/shared/ui/order-status-badge";
import { formatDate } from "@/shared/lib/format";

interface Entry {
  status: OrderStatus;
  enteredAt: Date;
}

/** Client-facing chronological timeline (translated labels only). */
export function ClientTimeline({ history }: { history: Entry[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no hay novedades.</p>;
  }

  return (
    <ol className="relative space-y-5 border-l border-slate-200 pl-5">
      {history.map((entry, index) => {
        const isLast = index === history.length - 1;
        return (
          <li key={`${entry.status}-${index}`} className="relative">
            <span
              className={`absolute -left-[26px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
                isLast ? "bg-sky-500 ring-2 ring-sky-200" : "bg-slate-300"
              }`}
            />
            <p className="text-xs text-slate-400">{formatDate(entry.enteredAt)}</p>
            <p
              className={`text-sm ${isLast ? "font-semibold text-slate-900" : "text-slate-600"}`}
            >
              {orderStatusLabel(entry.status)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
