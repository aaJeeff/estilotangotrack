"use client";

import { useActionState } from "react";
import { resendInvitationAction } from "../actions";
import { Button } from "@/shared/ui/button";
import type { FormState } from "@/shared/types/form";

async function action(_prev: FormState, formData: FormData): Promise<FormState> {
  return resendInvitationAction(formData);
}

export function ResendInviteButton({ clientId }: { clientId: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="id" value={clientId} />
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Enviando…" : "Reenviar invitación"}
      </Button>
      {state.message && <span className="text-sm text-green-700">{state.message}</span>}
      {state.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
