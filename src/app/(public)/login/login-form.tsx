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
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Ingresando…" : "Ingresar"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(signInAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <FieldError>{state.error}</FieldError>

      <SubmitButton />

      <p className="text-center text-sm text-slate-500">
        <Link href="/reset-password" className="text-slate-700 underline">
          Olvidé mi contraseña
        </Link>
      </p>
    </form>
  );
}
