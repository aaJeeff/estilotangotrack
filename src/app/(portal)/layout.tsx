import Link from "next/link";
import { requireRole } from "@/shared/lib/auth/session";
import { signOutAction } from "@/modules/auth/actions";

// Authenticated, data-driven area — never prerender.
export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireRole("CLIENT");

  return (
    <div className="customer-shell">
      <header className="customer-header">
        <div className="customer-header-inner">
          <Link href="/portal/orders" className="customer-brand">
            Camisetas <span className="customer-brand-mark">track</span>
          </Link>
          <div className="customer-header-actions">
            <Link href="/portal/orders" className="customer-orders-link">
              Mis pedidos
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="customer-logout">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="portal-main">{children}</main>
    </div>
  );
}
