"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { requestResetAction, type ActionState } from "@/modules/auth/actions";
import { Button } from "@/shared/ui/button";
import { Input, Label, FieldError } from "@/shared/ui/field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="public-submit" disabled={pending}>
      {pending ? "Enviando…" : "Enviar enlace"}
    </Button>
  );
}

export function ResetForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(requestResetAction, {});

  return (
    <form action={formAction} className="public-form">
      <div>
        <Label htmlFor="email" className="public-field-label">Email</Label>
        <Input className="public-input" id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <FieldError className="public-error">{state.error}</FieldError>
      {state.message && <p className="public-success">{state.message}</p>}

      <SubmitButton />

      <p className="public-link-row">
        <Link href="/login" className="public-link underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
