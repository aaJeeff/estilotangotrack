// Pure payment calculations. No persistence concerns here.

import type { PaymentStatus } from "@prisma/client";

export function computeBalance(total: number, paid: number): number {
  return Math.max(0, round2(total - paid));
}

export function computePaymentStatus(total: number, paid: number): PaymentStatus {
  if (total > 0 && paid >= total) return "FULLY_PAID";
  if (paid > 0) return "DEPOSIT_RECEIVED";
  return "PENDING_BALANCE";
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Sum of item subtotals (unitPrice * quantity). */
export function sumItems(items: { unitPrice: number; quantity: number }[]): number {
  return round2(items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0));
}
