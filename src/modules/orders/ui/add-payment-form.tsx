"use client";

import { useActionState } from "react";
import { addPaymentAction } from "../actions";
import { SubmitButton } from "@/shared/ui/submit-button";
import { Input, Label, FieldError } from "@/shared/ui/field";
import type { FormState } from "@/shared/types/form";

const selectClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

export function AddPaymentForm({ orderId }: { orderId: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(addPaymentAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="type">Tipo</Label>
          <select id="type" name="type" defaultValue="BALANCE" className={selectClass}>
            <option value="DEPOSIT">Seña</option>
            <option value="BALANCE">Saldo</option>
            <option value="ADJUSTMENT">Ajuste</option>
          </select>
        </div>
        <div>
          <Label htmlFor="method">Método</Label>
          <select id="method" name="method" defaultValue="TRANSFER" className={selectClass}>
            <option value="CASH">Efectivo</option>
            <option value="TRANSFER">Transferencia</option>
            <option value="MERCADO_PAGO">Mercado Pago</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="amount">Monto</Label>
        <Input id="amount" name="amount" type="number" step="0.01" required />
      </div>
      <div>
        <Label htmlFor="notes">Nota (opcional)</Label>
        <Input id="notes" name="notes" />
      </div>
      <FieldError>{state.error}</FieldError>
      {state.message && <p className="text-sm text-green-700">{state.message}</p>}
      <SubmitButton size="sm">Registrar pago</SubmitButton>
    </form>
  );
}
