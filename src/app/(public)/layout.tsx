export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell">
      <main className="public-frame">
        <div className="public-brand">
          <div className="customer-brand">
            Camisetas <span className="customer-brand-mark">track</span>
          </div>
          <p>Seguimiento de pedidos</p>
        </div>
        <section className="public-card liquid-panel">
          <div className="public-content">{children}</div>
        </section>
        <p className="public-footnote">Tu pedido, siempre a la vista.</p>
      </main>
    </div>
  );
}
