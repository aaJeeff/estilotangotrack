import Link from "next/link";
import { requireRole } from "@/shared/lib/auth/session";
import { signOutAction } from "@/modules/auth/actions";

// Authenticated, data-driven area — never prerender.
export const dynamic = "force-dynamic";

const navItems = [
  { href: "/admin/dashboard", label: "Panel" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/clients", label: "Clientes" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireRole("ADMIN");

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="font-semibold text-slate-900">
              Camisetas <span className="text-slate-400">Admin</span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{admin.email}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
        <nav className="flex items-center gap-1 border-t border-slate-100 px-4 py-2 sm:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
