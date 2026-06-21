import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Camisetas — Seguimiento de pedidos",
  description:
    "Seguí el avance de tu pedido de camisetas importadas en tiempo real, de China a tu puerta.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
