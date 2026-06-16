"use client";

import { useActionState } from "react";
import { assignTrackingAction } from "@/modules/tracking/actions";
import { SubmitButton } from "@/shared/ui/submit-button";
import { Input, Label, FieldError } from "@/shared/ui/field";
import type { FormState } from "@/shared/types/form";

export function AssignTrackingForm({
  orderId,
  currentNumber,
  currentCarrier,
}: {
  orderId: string;
  currentNumber?: string | null;
  currentCarrier?: string | null;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(assignTrackingAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <Label htmlFor="trackingNumber">Código de seguimiento</Label>
        <Input
          id="trackingNumber"
          name="trackingNumber"
          placeholder="EV072111902CN"
          defaultValue={currentNumber ?? ""}
          required
        />
      </div>
      <div>
        <Label htmlFor="carrier">Courier (opcional)</Label>
        <Input id="carrier" name="carrier" defaultValue={currentCarrier ?? ""} />
      </div>
      <FieldError>{state.error}</FieldError>
      {state.message && <p className="text-sm text-green-700">{state.message}</p>}
      <SubmitButton size="sm">
        {currentNumber ? "Actualizar código" : "Asignar tracking"}
      </SubmitButton>
    </form>
  );
}
