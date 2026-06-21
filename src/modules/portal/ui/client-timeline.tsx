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
    return <p className="portal-timeline-empty">Todavía no hay novedades.</p>;
  }

  return (
    <ol className="portal-timeline">
      {history.map((entry, index) => {
        const isLast = index === history.length - 1;
        return (
          <li key={`${entry.status}-${index}`} className={isLast ? "is-current" : undefined}>
            <span
              className="portal-timeline-node"
            />
            <p className="portal-timeline-date">{formatDate(entry.enteredAt)}</p>
            <p className="portal-timeline-name">
              {orderStatusLabel(entry.status)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
