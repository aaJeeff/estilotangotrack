"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setPasswordAction, type ActionState } from "@/modules/auth/actions";
import { Button } from "@/shared/ui/button";
import { Input, Label, FieldError } from "@/shared/ui/field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="public-submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar contraseña"}
    </Button>
  );
}

export function SetPasswordForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(setPasswordAction, {});

  return (
    <form action={formAction} className="public-form">
      <div>
        <Label htmlFor="password" className="public-field-label">Nueva contraseña</Label>
        <Input
          className="public-input"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <div>
        <Label htmlFor="confirm" className="public-field-label">Repetir contraseña</Label>
        <Input
          className="public-input"
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>

      <FieldError className="public-error">{state.error}</FieldError>

      <SubmitButton />
    </form>
  );
}
