"use client";

import { useEffect, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { INTERNATIONAL_ROUTE, legFraction } from "@/shared/config/map";

/**
 * 3D globe showing the international leg (Guangzhou -> Buenos Aires) with an
 * animated arc and a marker whose position is derived from the order PROGRESS
 * (never from real GPS).
 */
export function GlobeMap({ progress }: { progress: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ width: 320, height: 340 });

  const { origin, destination } = INTERNATIONAL_ROUTE;
  const fraction = legFraction(progress, "international");
  const plane = {
    lat: origin.lat + (destination.lat - origin.lat) * fraction,
    lng: origin.lng + (destination.lng - origin.lng) * fraction,
  };

  useEffect(() => {
    function measure() {
      const el = containerRef.current;
      if (el) setSize({ width: el.clientWidth, height: 340 });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: plane.lat, lng: plane.lng, altitude: 2.2 },
        1000,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, fraction]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-2xl bg-slate-950">
      <Globe
        ref={globeRef}
        width={size.width}
        height={size.height}
        backgroundColor="rgba(2,6,23,1)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        atmosphereColor="#38bdf8"
        atmosphereAltitude={0.18}
        arcsData={[
          {
            startLat: origin.lat,
            startLng: origin.lng,
            endLat: destination.lat,
            endLng: destination.lng,
          },
        ]}
        arcColor={() => ["#38bdf8", "#818cf8"]}
        arcStroke={0.5}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={4000}
        pointsData={[plane]}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => "#f8fafc"}
        pointAltitude={0.06}
        pointRadius={0.6}
        labelsData={[
          { ...origin, text: origin.name },
          { ...destination, text: destination.name },
        ]}
        labelLat="lat"
        labelLng="lng"
        labelText="text"
        labelSize={1.1}
        labelColor={() => "rgba(248,250,252,0.75)"}
        labelDotRadius={0.3}
      />
    </div>
  );
}

export default GlobeMap;
