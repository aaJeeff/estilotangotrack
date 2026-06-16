"use client";

import { useActionState } from "react";
import { syncNowAction } from "@/modules/tracking/actions";
import { Button } from "@/shared/ui/button";
import type { FormState } from "@/shared/types/form";

async function action(_prev: FormState, formData: FormData): Promise<FormState> {
  return syncNowAction(formData);
}

export function SyncNowButton({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Actualizando…" : "Actualizar ahora"}
      </Button>
      {state.message && <p className="text-sm text-slate-600">{state.message}</p>}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
