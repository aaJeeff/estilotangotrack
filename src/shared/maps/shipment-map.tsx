"use client";

// Decoupling seam for the shipment visualization. The rest of the app depends
// only on this component (props: progress + phase). Swapping the rendering
// technology (globe library, map provider) means editing only this file.

import dynamic from "next/dynamic";
import type { MapPhase } from "@/shared/config/order-status";
import { ArgentinaMap } from "./argentina-map";

// The globe pulls in three.js; load it only on the client, on demand.
const GlobeMap = dynamic(() => import("./globe-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[340px] w-full items-center justify-center rounded-2xl bg-slate-950 text-sm text-slate-400">
      Cargando mapa…
    </div>
  ),
});

export function ShipmentMap({ progress, phase }: { progress: number; phase: MapPhase }) {
  if (phase === "international") {
    return <GlobeMap progress={progress} />;
  }
  // national + delivered both use the national map (delivered = arrived).
  return <ArgentinaMap progress={progress} />;
}
