"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signInAction, type ActionState } from "@/modules/auth/actions";
import { Button } from "@/shared/ui/button";
import { Input, Label, FieldError } from "@/shared/ui/field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="public-submit" disabled={pending}>
      {pending ? "Ingresando…" : "Ingresar"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(signInAction, {});

  return (
    <form action={formAction} className="public-form">
      <div>
        <Label htmlFor="email" className="public-field-label">Email</Label>
        <Input className="public-input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password" className="public-field-label">Contraseña</Label>
        <Input
          className="public-input"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <FieldError className="public-error">{state.error}</FieldError>

      <SubmitButton />

      <p className="public-link-row">
        <Link href="/reset-password" className="public-link underline">
          Olvidé mi contraseña
        </Link>
      </p>
    </form>
  );
}
