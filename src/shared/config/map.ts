// Map geometry. Positions are derived from order PROGRESS, never from real GPS.
// Coordinates are illustrative anchors for the route visualization.

export interface GeoPoint {
  name: string;
  lat: number;
  lng: number;
}

// International route: Guangzhou (China) -> Buenos Aires (Argentina entry).
export const INTERNATIONAL_ROUTE = {
  origin: { name: "Guangzhou", lat: 23.1291, lng: 113.2644 } satisfies GeoPoint,
  destination: { name: "Buenos Aires", lat: -34.6037, lng: -58.3816 } satisfies GeoPoint,
};

// National route: Buenos Aires -> Rosario.
export const NATIONAL_ROUTE = {
  origin: { name: "Buenos Aires", lat: -34.6037, lng: -58.3816 } satisfies GeoPoint,
  destination: { name: "Rosario", lat: -32.9442, lng: -60.6505 } satisfies GeoPoint,
};

/**
 * Maps the global order progress (0–100) onto a per-leg fraction (0–1).
 * The international leg covers progress 0–65 (arrival in Argentina);
 * the national leg covers 65–100.
 */
export function legFraction(progress: number, phase: "international" | "national"): number {
  if (phase === "international") {
    return clamp01(progress / 65);
  }
  // national leg: 65 -> 100
  return clamp01((progress - 65) / 35);
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
