"use client";

import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import type { FormState } from "@/shared/types/form";
import { retryNotificationAction } from "../actions";

async function action(_prev: FormState, formData: FormData): Promise<FormState> {
  return retryNotificationAction(formData);
}

export function RetryNotificationButton({ notificationId }: { notificationId: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="mt-2 space-y-1">
      <input type="hidden" name="notificationId" value={notificationId} />
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Reintentando…" : "Reintentar email"}
      </Button>
      {state.message && <p className="text-xs text-green-700">{state.message}</p>}
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
