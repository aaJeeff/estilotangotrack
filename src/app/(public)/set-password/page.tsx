import { SetPasswordForm } from "./set-password-form";

export const metadata = { title: "Definir contraseña — Camisetas" };

export default function SetPasswordPage() {
  return (
    <div>
      <p className="portal-eyebrow mb-3 text-center">Primer acceso</p>
      <h1 className="public-title">Definí tu contraseña</h1>
      <p className="public-copy">
        Elegí una contraseña para acceder a tu cuenta y seguir tus pedidos.
      </p>
      <SetPasswordForm />
    </div>
  );
}
