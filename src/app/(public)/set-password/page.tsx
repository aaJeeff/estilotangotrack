import { SetPasswordForm } from "./set-password-form";

export const metadata = { title: "Definir contraseña — Camisetas" };

export default function SetPasswordPage() {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Definí tu contraseña</h2>
      <p className="mb-5 text-sm text-slate-500">
        Elegí una contraseña para acceder a tu cuenta y seguir tus pedidos.
      </p>
      <SetPasswordForm />
    </div>
  );
}
