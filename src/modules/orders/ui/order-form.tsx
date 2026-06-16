"use client";

import { useActionState, useMemo, useState } from "react";
import { createOrderAction } from "../actions";
import { SubmitButton } from "@/shared/ui/submit-button";
import { Input, Label, Textarea, FieldError } from "@/shared/ui/field";
import { Button } from "@/shared/ui/button";
import { formatCurrency } from "@/shared/lib/format";
import type { FormState } from "@/shared/types/form";

interface ClientOption {
  id: string;
  fullName: string;
  email: string;
}

interface ItemRow {
  productName: string;
  size: string;
  version: string;
  printName: string;
  printNumber: string;
  patches: string;
  unitPrice: string;
  quantity: string;
  ownerName: string;
  ownerContact: string;
}

function emptyItem(): ItemRow {
  return {
    productName: "",
    size: "",
    version: "",
    printName: "",
    printNumber: "",
    patches: "",
    unitPrice: "",
    quantity: "1",
    ownerName: "",
    ownerContact: "",
  };
}

export function OrderForm({ clients }: { clients: ClientOption[] }) {
  const [state, formAction] = useActionState<FormState, FormData>(createOrderAction, {});
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

  const itemsTotal = useMemo(
    () =>
      items.reduce(
        (acc, i) => acc + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0),
        0,
      ),
    [items],
  );

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="clientId">Cliente</Label>
          <select
            id="clientId"
            name="clientId"
            required
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Elegí un cliente…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} ({c.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Camisetas</h3>
          <span className="text-sm text-slate-500">
            Subtotal ítems: {formatCurrency(itemsTotal)}
          </span>
        </div>

        {items.map((item, index) => (
          <div key={index} className="rounded-xl border border-slate-200 p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Field label="Producto" required>
                <Input
                  value={item.productName}
                  onChange={(e) => updateItem(index, { productName: e.target.value })}
                  required
                />
              </Field>
              <Field label="Talle" required>
                <Input
                  value={item.size}
                  onChange={(e) => updateItem(index, { size: e.target.value })}
                  required
                />
              </Field>
              <Field label="Versión">
                <Input
                  value={item.version}
                  onChange={(e) => updateItem(index, { version: e.target.value })}
                />
              </Field>
              <Field label="Parches">
                <Input
                  value={item.patches}
                  onChange={(e) => updateItem(index, { patches: e.target.value })}
                />
              </Field>
              <Field label="Nombre estampado">
                <Input
                  value={item.printName}
                  onChange={(e) => updateItem(index, { printName: e.target.value })}
                />
              </Field>
              <Field label="Número estampado">
                <Input
                  value={item.printNumber}
                  onChange={(e) => updateItem(index, { printNumber: e.target.value })}
                />
              </Field>
              <Field label="Precio unitario" required>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                  required
                />
              </Field>
              <Field label="Cantidad" required>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                  required
                />
              </Field>
              <Field label="Propietario (interno)">
                <Input
                  value={item.ownerName}
                  onChange={(e) => updateItem(index, { ownerName: e.target.value })}
                />
              </Field>
              <Field label="Contacto propietario">
                <Input
                  value={item.ownerContact}
                  onChange={(e) => updateItem(index, { ownerContact: e.target.value })}
                />
              </Field>
            </div>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                className="mt-2 text-sm text-red-600 hover:underline"
              >
                Quitar camiseta
              </button>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setItems((prev) => [...prev, emptyItem()])}
        >
          + Agregar camiseta
        </Button>
      </div>

      {/* Payment */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="totalAmount">Total del pedido</Label>
          <Input
            id="totalAmount"
            name="totalAmount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={itemsTotal || ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="depositAmount">Seña abonada</Label>
          <Input
            id="depositAmount"
            name="depositAmount"
            type="number"
            step="0.01"
            min="0"
            required
          />
        </div>
        <div>
          <Label htmlFor="depositMethod">Método</Label>
          <select
            id="depositMethod"
            name="depositMethod"
            defaultValue="TRANSFER"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="CASH">Efectivo</option>
            <option value="TRANSFER">Transferencia</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="internalNotes">Observaciones internas</Label>
        <Textarea id="internalNotes" name="internalNotes" />
      </div>

      <FieldError>{state.error}</FieldError>
      <SubmitButton size="lg">Crear pedido</SubmitButton>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
