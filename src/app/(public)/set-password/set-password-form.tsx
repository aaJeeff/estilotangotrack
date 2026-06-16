"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setPasswordAction, type ActionState } from "@/modules/auth/actions";
import { Button } from "@/shared/ui/button";
import { Input, Label, FieldError } from "@/shared/ui/field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Guardando…" : "Guardar contraseña"}
    </Button>
  );
}

export function SetPasswordForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(setPasswordAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <div>
        <Label htmlFor="confirm">Repetir contraseña</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>

      <FieldError>{state.error}</FieldError>

      <SubmitButton />
    </form>
  );
}
