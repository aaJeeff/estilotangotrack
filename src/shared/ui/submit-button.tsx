"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./button";

interface SubmitButtonProps extends ButtonProps {
  pendingLabel?: string;
}

export function SubmitButton({ children, pendingLabel, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? (pendingLabel ?? "Guardando…") : children}
    </Button>
  );
}
