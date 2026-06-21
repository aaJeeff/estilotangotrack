import type { OrderStatus } from "@prisma/client";

export type TrackingScene =
  | "international"
  | "customs"
  | "route"
  | "distribution"
  | "delivered"
  | "cancelled";

export type TrackingStepId =
  | "confirmed"
  | "preparing"
  | "international"
  | "customs"
  | "to-rosario"
  | "distribution"
  | "delivered";

export interface TrackingSceneConfig {
  step: TrackingStepId;
  stepIndex: number;
  scene: TrackingScene;
  progress: number;
  routeKicker: string;
  routeStart: string;
  routeEnd: string;
  activeRoute: boolean;
}

export interface TrackingTimelineEntry {
  id: string;
  status?: OrderStatus;
  label: string;
  date: string;
  state: "done" | "current" | "pending";
}

export interface TrackingProductData {
  id: string;
  name: string;
  meta: string;
  marker: string;
}

export interface TrackingSummaryRow {
  label: string;
  value: string;
  state?: "complete" | "pending";
}

export interface TrackingExperienceData {
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  statusHelp: string;
  progress: number;
  estimatedTitle: string;
  estimatedDate: string;
  timeline: TrackingTimelineEntry[];
  products: TrackingProductData[];
  summary: TrackingSummaryRow[];
}
