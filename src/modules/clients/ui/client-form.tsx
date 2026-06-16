"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/shared/ui/submit-button";
import { Input, Label, FieldError } from "@/shared/ui/field";
import type { FormState } from "@/shared/types/form";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

interface ClientFormProps {
  action: Action;
  submitLabel: string;
  initial?: {
    id?: string;
    fullName?: string;
    email?: string;
    instagram?: string | null;
    whatsapp?: string | null;
  };
}

export function ClientForm({ action, submitLabel, initial }: ClientFormProps) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <div>
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input id="fullName" name="fullName" defaultValue={initial?.fullName} required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={initial?.email}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="instagram">Instagram</Label>
          <Input id="instagram" name="instagram" defaultValue={initial?.instagram ?? ""} />
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={initial?.whatsapp ?? ""} />
        </div>
      </div>

      <FieldError>{state.error}</FieldError>
      {state.message && <p className="text-sm text-green-700">{state.message}</p>}

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
