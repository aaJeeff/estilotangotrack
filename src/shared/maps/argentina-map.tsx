"use client";

import { motion } from "framer-motion";
import { legFraction } from "@/shared/config/map";

// Stylized national map: Buenos Aires -> Rosario along a curved path.
// Coordinates are in the SVG viewBox space (not geographic), chosen for looks.
const BA = { x: 250, y: 250 };
const ROSARIO = { x: 200, y: 150 };
const CONTROL = { x: 300, y: 180 }; // bend the route for an elegant curve

// Quadratic Bézier point at parameter t.
function bezier(t: number) {
  const mt = 1 - t;
  return {
    x: mt * mt * BA.x + 2 * mt * t * CONTROL.x + t * t * ROSARIO.x,
    y: mt * mt * BA.y + 2 * mt * t * CONTROL.y + t * t * ROSARIO.y,
  };
}

export function ArgentinaMap({ progress }: { progress: number }) {
  const fraction = legFraction(progress, "national");
  const pos = bezier(fraction);
  const path = `M ${BA.x} ${BA.y} Q ${CONTROL.x} ${CONTROL.y} ${ROSARIO.x} ${ROSARIO.y}`;

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50 to-slate-100 p-2">
      <svg viewBox="0 0 400 340" className="h-[340px] w-full">
        {/* Stylized Argentina silhouette (simplified) */}
        <path
          d="M210 40 L235 70 L228 120 L255 150 L240 200 L262 250 L240 300 L210 330
             L200 300 L175 270 L195 230 L170 190 L190 150 L172 110 L195 70 Z"
          fill="#e2e8f0"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />

        {/* Route */}
        <path
          d={path}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
        <motion.path
          d={path}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: fraction }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />

        {/* Endpoints */}
        <Endpoint x={BA.x} y={BA.y} label="Buenos Aires" />
        <Endpoint x={ROSARIO.x} y={ROSARIO.y} label="Rosario" />

        {/* Moving marker */}
        <motion.circle
          cx={pos.x}
          cy={pos.y}
          r={6}
          fill="#0ea5e9"
          stroke="#fff"
          strokeWidth="2"
          initial={false}
          animate={{ cx: pos.x, cy: pos.y }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

function Endpoint({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={4} fill="#475569" />
      <text x={x + 8} y={y + 4} fontSize="11" fill="#475569">
        {label}
      </text>
    </g>
  );
}

export default ArgentinaMap;
