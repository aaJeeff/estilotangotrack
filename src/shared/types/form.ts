// Shared shape returned by Server Actions used with useActionState.
export interface FormState {
  error?: string;
  message?: string;
  ok?: boolean;
}

export const emptyFormState: FormState = {};
