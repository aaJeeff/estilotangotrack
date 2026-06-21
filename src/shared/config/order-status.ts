// Single source of truth for the client-facing order lifecycle.
// Labels and help texts are in Spanish (UI language); identifiers are in English.

/**
 * Ordered progression of trackable statuses. Index = progression rank, used to
 * enforce monotonicity (a status can only ever move forward).
 * CANCELLED is intentionally excluded — it is a terminal side-state.
 */
export const ORDER_STATUS_SEQUENCE = [
  "CONFIRMED",
  "DISPATCHED_CHINA",
  "ARRIVED_ARGENTINA",
  "CUSTOMS_PROCESSING",
  "DECLARED",
  "EN_ROUTE_ROSARIO",
  "RECEIVED_BY_US",
  "DELIVERED",
] as const;

export type TrackableStatus = (typeof ORDER_STATUS_SEQUENCE)[number];
export type OrderStatusValue = TrackableStatus | "CANCELLED";

/** Which map the client portal should render for a given status. */
export type MapPhase = "international" | "national" | "delivered";

export interface OrderStatusMeta {
  /** Client-facing label (Spanish). */
  label: string;
  /** Progress bar fill, 0–100. Deliberately NON-uniform (real-world experience). */
  progress: number;
  /** Whether reaching this status should trigger a client email notification. */
  notify: boolean;
  /** Friendly contextual explanation shown in the help accordion. */
  help: string;
  /** Which map view to display. */
  phase: MapPhase;
}

export const ORDER_STATUS_META: Record<TrackableStatus, OrderStatusMeta> = {
  CONFIRMED: {
    label: "Pedido confirmado",
    progress: 0,
    notify: false,
    phase: "international",
    help: "Tu pedido fue confirmado y registrado. Estamos coordinando con el proveedor el despacho de tu camiseta. No necesitás hacer nada, te avisaremos cuando sea despachado.",
  },
  DISPATCHED_CHINA: {
    label: "En vuelo internacional",
    progress: 45,
    notify: true,
    phase: "international",
    help: "¡Tu pedido ya salió! Fue despachado desde China y comenzó su viaje internacional. Esta etapa suele ser la más larga del proceso.",
  },
  ARRIVED_ARGENTINA: {
    label: "En aduana",
    progress: 75,
    notify: true,
    phase: "national",
    help: "Tu pedido ya llegó a Argentina. A partir de acá comienza el proceso de ingreso al país. Nosotros nos encargamos de toda la gestión.",
  },
  CUSTOMS_PROCESSING: {
    label: "En aduana",
    progress: 75,
    notify: false,
    phase: "national",
    help: "Tu pedido se encuentra en proceso de liberación aduanera. No necesitás realizar ninguna acción, nosotros nos encargamos de esta gestión.",
  },
  DECLARED: {
    label: "En aduana",
    progress: 82,
    notify: false,
    phase: "national",
    help: "El pedido fue declarado y está avanzando en su liberación. Ya falta menos para que lo tengamos con nosotros.",
  },
  EN_ROUTE_ROSARIO: {
    label: "En camino a Rosario",
    progress: 90,
    notify: false,
    phase: "national",
    help: "Tu pedido ya fue liberado y está en camino hacia Rosario. Pronto lo recibiremos para coordinar la entrega final.",
  },
  RECEIVED_BY_US: {
    label: "En distribución local",
    progress: 97,
    notify: true,
    phase: "national",
    help: "¡Ya tenemos tu pedido con nosotros! Nos pondremos en contacto para coordinar la entrega final.",
  },
  DELIVERED: {
    label: "Entregado",
    progress: 100,
    notify: false,
    phase: "delivered",
    help: "¡Tu pedido fue entregado! Gracias por tu confianza. Esperamos que disfrutes tu camiseta.",
  },
};

/** Progression rank of a status (lower = earlier). CANCELLED returns -1. */
export function statusRank(status: OrderStatusValue): number {
  if (status === "CANCELLED") return -1;
  return ORDER_STATUS_SEQUENCE.indexOf(status);
}

/** Progress percentage for a status. CANCELLED returns 0. */
export function statusProgress(status: OrderStatusValue): number {
  if (status === "CANCELLED") return 0;
  return ORDER_STATUS_META[status].progress;
}

/** Returns the more advanced of two statuses (monotonic helper). */
export function maxStatus(a: TrackableStatus, b: TrackableStatus): TrackableStatus {
  return statusRank(a) >= statusRank(b) ? a : b;
}

export const ESTIMATED_DELIVERY_DAYS = { min: 35, max: 45 } as const;

export type SyncZoneValue = "CHINA" | "ARGENTINA" | "NEAR_DELIVERY";

/** Which sync cadence applies given the current business status. */
export function syncZoneForStatus(status: OrderStatusValue): SyncZoneValue {
  const rank = statusRank(status);
  if (rank >= statusRank("EN_ROUTE_ROSARIO")) return "NEAR_DELIVERY";
  if (rank >= statusRank("ARRIVED_ARGENTINA")) return "ARGENTINA";
  return "CHINA";
}

/** Once delivered (or cancelled) there is nothing left to track. */
export function isTerminal(status: OrderStatusValue): boolean {
  return status === "DELIVERED" || status === "CANCELLED";
}
