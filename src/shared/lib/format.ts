// Formatting helpers (Spanish / Argentina locale).

import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

/** Formats a number or Prisma Decimal-like value as ARS currency. */
export function formatCurrency(value: number | string | { toString(): string }): string {
  const n = typeof value === "number" ? value : Number(value.toString());
  return currencyFormatter.format(Number.isFinite(n) ? n : 0);
}

/** "08/06/2026" */
export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: es });
}

/** "08/06/2026 14:30" */
export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
}

/** "8 de junio de 2026" */
export function formatLongDate(date: Date | string): string {
  return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: es });
}

/** Whole calendar days elapsed since a date (never negative). */
export function daysSince(date: Date | string): number {
  return Math.max(0, differenceInCalendarDays(new Date(), new Date(date)));
}

/** 42 -> "#0042" */
export function formatOrderNumber(n: number): string {
  return `#${String(n).padStart(4, "0")}`;
}
