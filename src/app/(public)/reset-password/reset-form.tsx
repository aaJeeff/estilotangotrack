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
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Enviando…" : "Enviar enlace"}
    </Button>
  );
}

export function ResetForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(requestResetAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <FieldError>{state.error}</FieldError>
      {state.message && <p className="text-sm text-green-700">{state.message}</p>}

      <SubmitButton />

      <p className="text-center text-sm text-slate-500">
        <Link href="/login" className="text-slate-700 underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
