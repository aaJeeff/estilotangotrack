import type { OrderStatus } from "@prisma/client";
import type { TrackingSceneConfig, TrackingStepId } from "./tracking-types";

export const TRACKING_STEPS: ReadonlyArray<{ id: TrackingStepId; label: string }> = [
  { id: "confirmed", label: "Pedido confirmado" },
  { id: "preparing", label: "En preparación" },
  { id: "international", label: "En vuelo internacional" },
  { id: "customs", label: "En aduana" },
  { id: "to-rosario", label: "En camino a Rosario" },
  { id: "distribution", label: "En distribución local" },
  { id: "delivered", label: "Entregado" },
] as const;

export function trackingStepForStatus(status: OrderStatus): TrackingStepId {
  switch (status) {
    case "CONFIRMED":
      return "confirmed";
    case "DISPATCHED_CHINA":
      return "international";
    case "ARRIVED_ARGENTINA":
    case "CUSTOMS_PROCESSING":
    case "DECLARED":
      return "customs";
    case "EN_ROUTE_ROSARIO":
      return "to-rosario";
    case "RECEIVED_BY_US":
      return "distribution";
    case "DELIVERED":
      return "delivered";
    case "CANCELLED":
      return "confirmed";
  }
}

export function trackingSceneForStatus(
  status: OrderStatus,
  progress: number,
): TrackingSceneConfig {
  const step = trackingStepForStatus(status);
  const stepIndex = TRACKING_STEPS.findIndex((entry) => entry.id === step);
  switch (status) {
    case "CONFIRMED":
      return international(step, stepIndex, progress, false, "Pedido confirmado");
    case "DISPATCHED_CHINA":
      return international(step, stepIndex, progress, true, "Seguimiento internacional");
    case "ARRIVED_ARGENTINA":
    case "CUSTOMS_PROCESSING":
    case "DECLARED":
      return national(step, stepIndex, "customs", progress, "Seguimiento nacional", false);
    case "EN_ROUTE_ROSARIO":
      return national(step, stepIndex, "route", progress, "Seguimiento nacional", true);
    case "RECEIVED_BY_US":
      return national(step, stepIndex, "distribution", progress, "Seguimiento nacional", false);
    case "DELIVERED":
      return national(step, stepIndex, "delivered", 100, "Pedido entregado", false);
    case "CANCELLED":
      return {
        step,
        stepIndex,
        scene: "cancelled",
        progress: 0,
        routeKicker: "Pedido cancelado",
        routeStart: "Sin recorrido activo",
        routeEnd: "",
        activeRoute: false,
      };
  }
}

function international(
  step: TrackingStepId,
  stepIndex: number,
  progress: number,
  activeRoute: boolean,
  routeKicker: string,
): TrackingSceneConfig {
  return {
    step,
    stepIndex,
    scene: "international",
    progress,
    routeKicker,
    routeStart: "Guangzhou, China",
    routeEnd: "Buenos Aires, Argentina",
    activeRoute,
  };
}

function national(
  step: TrackingStepId,
  stepIndex: number,
  scene: "customs" | "route" | "distribution" | "delivered",
  progress: number,
  routeKicker: string,
  activeRoute: boolean,
): TrackingSceneConfig {
  return {
    step,
    stepIndex,
    scene,
    progress,
    routeKicker,
    routeStart: "Buenos Aires, Argentina",
    routeEnd: "Rosario, Argentina",
    activeRoute,
  };
}
