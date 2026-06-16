import { ResetForm } from "./reset-form";

export const metadata = { title: "Restablecer contraseña — Camisetas" };

export default function ResetPasswordPage() {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Restablecer contraseña</h2>
      <p className="mb-5 text-sm text-slate-500">
        Ingresá tu email y te enviaremos un enlace para crear una nueva contraseña.
      </p>
      <ResetForm />
    </div>
  );
}
