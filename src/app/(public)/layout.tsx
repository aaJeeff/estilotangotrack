export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 to-slate-700 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Camisetas</h1>
          <p className="mt-1 text-sm text-slate-300">Seguimiento de pedidos</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl">{children}</div>
      </div>
    </div>
  );
}
