import type { PaymentStatus } from "@prisma/client";

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  DEPOSIT_RECEIVED: "Seña recibida",
  PENDING_BALANCE: "Pendiente de saldo",
  FULLY_PAID: "Pagado completamente",
};

export const PAYMENT_STATUS_TONE: Record<
  PaymentStatus,
  "neutral" | "amber" | "green"
> = {
  DEPOSIT_RECEIVED: "amber",
  PENDING_BALANCE: "neutral",
  FULLY_PAID: "green",
};

export const PAYMENT_TYPE_LABEL = {
  DEPOSIT: "Seña",
  BALANCE: "Saldo",
  ADJUSTMENT: "Ajuste",
} as const;

export const PAYMENT_METHOD_LABEL = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  MERCADO_PAGO: "Mercado Pago",
  OTHER: "Otro",
} as const;
