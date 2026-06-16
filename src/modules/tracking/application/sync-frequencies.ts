import "server-only";
import { prisma } from "@/shared/lib/prisma";
import type { SyncZoneValue } from "@/shared/config/order-status";

const DEFAULTS: Record<SyncZoneValue, number> = {
  CHINA: 12,
  ARGENTINA: 6,
  NEAR_DELIVERY: 2,
};

/** Hours between automatic syncs per zone (from AppConfig, with fallback). */
export async function getSyncFrequencies(): Promise<Record<SyncZoneValue, number>> {
  const cfg = await prisma.appConfig.findUnique({
    where: { key: "sync_frequencies_hours" },
  });
  const v = (cfg?.value ?? {}) as Partial<Record<SyncZoneValue, number>>;
  return {
    CHINA: typeof v.CHINA === "number" ? v.CHINA : DEFAULTS.CHINA,
    ARGENTINA: typeof v.ARGENTINA === "number" ? v.ARGENTINA : DEFAULTS.ARGENTINA,
    NEAR_DELIVERY:
      typeof v.NEAR_DELIVERY === "number" ? v.NEAR_DELIVERY : DEFAULTS.NEAR_DELIVERY,
  };
}
