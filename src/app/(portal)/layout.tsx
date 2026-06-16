import Link from "next/link";
import { requireRole } from "@/shared/lib/auth/session";
import { signOutAction } from "@/modules/auth/actions";

// Authenticated, data-driven area — never prerender.
export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireRole("CLIENT");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/portal/orders" className="font-semibold text-slate-900">
            Camisetas
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
