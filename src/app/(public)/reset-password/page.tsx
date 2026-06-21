import { ResetForm } from "./reset-form";

export const metadata = { title: "Restablecer contraseña — Camisetas" };

export default function ResetPasswordPage() {
  return (
    <div>
      <p className="portal-eyebrow mb-3 text-center">Acceso</p>
      <h1 className="public-title">Restablecer contraseña</h1>
      <p className="public-copy">
        Ingresá tu email y te enviaremos un enlace para crear una nueva contraseña.
      </p>
      <ResetForm />
    </div>
  );
}
