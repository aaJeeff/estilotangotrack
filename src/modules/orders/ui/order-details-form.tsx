"use client";

import { useActionState } from "react";
import { updateOrderAction } from "../actions";
import { SubmitButton } from "@/shared/ui/submit-button";
import { Input, Label, Textarea, FieldError } from "@/shared/ui/field";
import type { FormState } from "@/shared/types/form";

export function OrderDetailsForm({
  orderId,
  totalAmount,
  internalNotes,
}: {
  orderId: string;
  totalAmount: string;
  internalNotes: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(updateOrderAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={orderId} />
      <div>
        <Label htmlFor="totalAmount">Total del pedido</Label>
        <Input
          id="totalAmount"
          name="totalAmount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={totalAmount}
          required
        />
      </div>
      <div>
        <Label htmlFor="internalNotes">Observaciones internas</Label>
        <Textarea id="internalNotes" name="internalNotes" defaultValue={internalNotes} />
      </div>
      <FieldError>{state.error}</FieldError>
      {state.message && <p className="text-sm text-green-700">{state.message}</p>}
      <SubmitButton size="sm">Guardar cambios</SubmitButton>
    </form>
  );
}
