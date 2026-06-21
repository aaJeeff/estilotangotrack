import { LoginForm } from "./login-form";

export const metadata = { title: "Ingresar — Camisetas" };

export default function LoginPage() {
  return (
    <div>
      <p className="portal-eyebrow mb-3 text-center">Área de clientes</p>
      <h1 className="public-title">Seguí tu pedido</h1>
      <p className="public-copy">Ingresá con el email que usaste en tu compra.</p>
      <LoginForm />
    </div>
  );
}
