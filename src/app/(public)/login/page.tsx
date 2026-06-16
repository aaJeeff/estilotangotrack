import { LoginForm } from "./login-form";

export const metadata = { title: "Ingresar — Camisetas" };

export default function LoginPage() {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Iniciá sesión</h2>
      <p className="mb-5 text-sm text-slate-500">Accedé para ver el estado de tus pedidos.</p>
      <LoginForm />
    </div>
  );
}
