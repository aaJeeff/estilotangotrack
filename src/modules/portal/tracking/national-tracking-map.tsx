"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import type { TrackingScene } from "./tracking-types";
import styles from "./tracking-experience.module.css";

const BUENOS_AIRES: [number, number] = [-58.3816, -34.6037];
const ROSARIO: [number, number] = [-60.6393, -32.9468];

const FALLBACK_ROUTE = {
  type: "Feature" as const,
  geometry: {
    type: "LineString" as const,
    coordinates: [
      [-58.3816, -34.6037],
      [-58.55, -34.48],
      [-58.75, -34.32],
      [-58.95, -34.12],
      [-59.18, -33.92],
      [-59.42, -33.72],
      [-59.72, -33.48],
      [-59.96, -33.3],
      [-60.22, -33.13],
      [-60.45, -33.02],
      [-60.6393, -32.9468],
    ],
  },
  properties: {},
};

interface NationalTrackingMapProps {
  scene: Exclude<TrackingScene, "international" | "cancelled">;
  sheetProgress: number;
}

export function NationalTrackingMap({ scene, sheetProgress }: NationalTrackingMapProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [fallbackVisible, setFallbackVisible] = useState(false);

  useEffect(() => {
    mapRef.current?.resize();
  }, [sheetProgress]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let map: MapLibreMap | null = null;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;
    let stopRouteAnimation = () => {};
    const markers: MapLibreMarker[] = [];

    const initialize = async () => {
      try {
        const maplibregl = await import("maplibre-gl");
        if (cancelled) return;
        const isDesktop = window.matchMedia("(min-width: 900px)").matches;
        const home = homeView(isDesktop);
        map = new maplibregl.Map({
          container: host,
          style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
          center: home.center,
          zoom: home.zoom,
          pitch: home.pitch,
          bearing: home.bearing,
          canvasContextAttributes: { antialias: true },
          dragRotate: false,
          touchPitch: false,
          cooperativeGestures: false,
          dragPan: true,
          scrollZoom: true,
          doubleClickZoom: true,
          touchZoomRotate: true,
          attributionControl: {},
        });
        mapRef.current = map;
        map.setPadding(home.padding);

        const styleTimeout = window.setTimeout(() => {
          if (!map?.isStyleLoaded()) setFallbackVisible(true);
        }, 9000);

        map.once("load", async () => {
          window.clearTimeout(styleTimeout);
          if (!map || cancelled) return;
          setFallbackVisible(false);
          host.dataset.mapStatus = "loaded";
          applyPalette(map);
          const route = await loadRoute();
          if (!map || cancelled) return;
          host.dataset.routeSource = route === FALLBACK_ROUTE ? "fallback" : "osrm";
          addRouteLayers(map, route, scene);
          addCityAreas(map, scene);
          addMarkers(map, maplibregl, scene, markers);
          addClouds(map, maplibregl, isDesktop, markers);
          try {
            await addLandmarks(map, maplibregl);
            host.dataset.landmarks = "loaded";
          } catch {
            host.dataset.landmarks = "unavailable";
            // Landmarks are decorative; route and city context remain available.
          }
          if (scene === "route") {
            stopRouteAnimation = animateRoute(map);
          }
        });

        map.on("error", (event) => {
          if (!map?.isStyleLoaded() && String(event.error).includes("style")) {
            setFallbackVisible(true);
          }
        });

        let easingHome = false;
        const scheduleHome = () => {
          if (resetTimer) clearTimeout(resetTimer);
          resetTimer = setTimeout(() => {
            easingHome = true;
            map?.easeTo({
              ...home,
              duration: 2400,
              easing: (value) => 1 - Math.pow(1 - value, 4),
            });
          }, 2400);
        };
        map.on("movestart", () => {
          if (!easingHome && resetTimer) clearTimeout(resetTimer);
        });
        map.on("moveend", () => {
          if (easingHome) {
            easingHome = false;
          } else {
            scheduleHome();
          }
        });
      } catch {
        host.dataset.mapStatus = "fallback";
        setFallbackVisible(true);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
      if (resetTimer) clearTimeout(resetTimer);
      stopRouteAnimation();
      markers.forEach((marker) => marker.remove());
      map?.remove();
      mapRef.current = null;
    };
  }, [scene]);

  return (
    <div className={styles.nationalHost} aria-label="Mapa del recorrido Buenos Aires a Rosario">
      <div ref={hostRef} className={styles.realMap} />
      <div className={styles.realAtmosphere} aria-hidden />
      {fallbackVisible && <NationalFallback scene={scene} />}
    </div>
  );
}

function NationalFallback({ scene }: Pick<NationalTrackingMapProps, "scene">) {
  return (
    <div className={styles.nationalFallback} data-scene={scene} aria-hidden>
      <svg viewBox="0 0 1200 780" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="fallback-land" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#9fc08a" />
            <stop offset="0.55" stopColor="#648f78" />
            <stop offset="1" stopColor="#3b6775" />
          </linearGradient>
          <filter id="fallback-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <path id="fallback-route" d="M885 610 C828 548 785 507 730 457 C668 401 606 349 548 294 C526 273 514 250 508 229" pathLength="1" />
        </defs>
        <rect width="1200" height="780" fill="url(#fallback-land)" />
        <path d="M830 30 C970 50 1120 128 1200 252 L1200 780 L1010 780 C1017 710 986 650 914 612 C870 589 852 560 875 521 C900 478 966 445 1018 392 C1080 329 1084 238 1008 170 C952 119 883 89 830 30Z" fill="#143f69" opacity=".92" />
        <g opacity=".45" fill="none" stroke="#f4f7f2" strokeWidth="2">
          <path d="M900 622 C806 560 734 523 658 473 C574 418 500 356 430 302" />
          <path d="M865 622 C792 650 722 665 640 658 C552 651 465 618 388 578" />
          <path d="M508 229 C590 206 680 198 760 212" />
        </g>
        <use href="#fallback-route" fill="none" stroke="rgba(4,20,38,.38)" strokeWidth="14" strokeLinecap="round" />
        {scene !== "customs" && (
          <use
            href="#fallback-route"
            className={scene === "route" ? styles.fallbackRouteProgress : undefined}
            fill="none"
            stroke="#9ee5ff"
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#fallback-glow)"
          />
        )}
        <g className={styles.fallbackCity} transform="translate(885 610)">
          <circle r="34" fill="none" stroke="#79c9ff" strokeWidth="2" />
          <circle r="12" fill="#fff" stroke="#4baeff" strokeWidth="5" />
          <text x="32" y="-20">Buenos Aires</text>
        </g>
        <g className={styles.fallbackCity} transform="translate(508 229)">
          <circle r="31" fill="none" stroke="#79c9ff" strokeWidth="2" />
          <circle r="11" fill="#fff" stroke="#4baeff" strokeWidth="5" />
          <text x="30" y="-18">Rosario</text>
        </g>
      </svg>
    </div>
  );
}

function homeView(isDesktop: boolean) {
  return isDesktop
    ? {
        center: [-59.22, -33.77] as [number, number],
        zoom: 7.34,
        pitch: 57,
        bearing: 2,
        padding: { top: 94, right: 72, bottom: 64, left: 430 },
      }
    : {
        center: [-59.6, -33.82] as [number, number],
        zoom: 6.48,
        pitch: 57,
        bearing: -27,
        padding: { top: 82, right: 24, bottom: 170, left: 24 },
      };
}

async function loadRoute() {
  try {
    const response = await fetch(
      "https://router.project-osrm.org/route/v1/driving/-58.3816,-34.6037;-60.6393,-32.9468?overview=full&geometries=geojson&alternatives=false&steps=false",
    );
    if (!response.ok) return FALLBACK_ROUTE;
    const data = (await response.json()) as {
      routes?: { geometry?: { coordinates?: number[][] } }[];
    };
    const coordinates = data.routes?.[0]?.geometry?.coordinates;
    if (!coordinates || coordinates.length < 2) return FALLBACK_ROUTE;
    return {
      type: "Feature" as const,
      geometry: { type: "LineString" as const, coordinates },
      properties: {},
    };
  } catch {
    return FALLBACK_ROUTE;
  }
}

function applyPalette(map: MapLibreMap) {
  map.getStyle().layers?.forEach((layer) => {
    const id = layer.id.toLowerCase();
    try {
      if (layer.type === "background") map.setPaintProperty(layer.id, "background-color", "#789a86");
      if (layer.type === "fill" && ["water", "ocean", "river", "lake"].some((word) => id.includes(word))) {
        map.setPaintProperty(layer.id, "fill-color", "#163f72");
        map.setPaintProperty(layer.id, "fill-opacity", 0.92);
      }
      if (layer.type === "fill" && (id.includes("land") || id.includes("park") || id.includes("wood"))) {
        map.setPaintProperty(layer.id, "fill-color", id.includes("park") || id.includes("wood") ? "#5f9276" : "#779b85");
        map.setPaintProperty(layer.id, "fill-opacity", 0.88);
      }
      if (layer.type === "line" && id.includes("road")) {
        map.setPaintProperty(layer.id, "line-color", "#dbe6df");
        map.setPaintProperty(layer.id, "line-opacity", id.includes("minor") ? 0.34 : 0.54);
      }
      if (layer.type === "symbol") {
        map.setPaintProperty(layer.id, "text-opacity", 0);
        map.setPaintProperty(layer.id, "icon-opacity", 0);
      }
    } catch {
      // Shared styles do not expose every paint property on every layer.
    }
  });
}

function addRouteLayers(
  map: MapLibreMap,
  route: Awaited<ReturnType<typeof loadRoute>>,
  scene: NationalTrackingMapProps["scene"],
) {
  map.addSource("tracking-route", { type: "geojson", data: route, lineMetrics: true });
  map.addLayer({
    id: "tracking-route-shadow",
    type: "line",
    source: "tracking-route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "rgba(2,13,28,.42)",
      "line-width": ["interpolate", ["linear"], ["zoom"], 6, 7, 8, 12],
      "line-blur": 5,
      "line-opacity": scene === "customs" ? 0.08 : 0.52,
    },
  });
  map.addLayer({
    id: "tracking-route-glow",
    type: "line",
    source: "tracking-route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "rgba(69,171,255,.64)",
      "line-width": ["interpolate", ["linear"], ["zoom"], 6, 6, 8, 10],
      "line-blur": 3.5,
      "line-opacity": scene === "customs" ? 0.04 : 0.74,
    },
  });
  map.addLayer({
    id: "tracking-route-base",
    type: "line",
    source: "tracking-route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "rgba(215,240,255,.52)",
      "line-width": ["interpolate", ["linear"], ["zoom"], 6, 3.5, 8, 5.5],
      "line-opacity": scene === "customs" ? 0.08 : 0.78,
    },
  });
  map.addLayer({
    id: "tracking-route-progress",
    type: "line",
    source: "tracking-route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-gradient": routeGradient(scene === "delivered" || scene === "distribution" ? 1 : 0.06),
      "line-width": ["interpolate", ["linear"], ["zoom"], 6, 4, 8, 6],
      "line-blur": 0.4,
      "line-opacity": scene === "customs" ? 0 : 1,
    },
  });
}

function addCityAreas(map: MapLibreMap, scene: NationalTrackingMapProps["scene"]) {
  map.addSource("tracking-city-areas", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [
        ellipse("buenos-aires", BUENOS_AIRES, 0.33, 0.23),
        ellipse("rosario", ROSARIO, 0.17, 0.12),
      ],
    },
  });
  map.addLayer({
    id: "tracking-city-fill",
    type: "fill",
    source: "tracking-city-areas",
    paint: {
      "fill-color": ["case", ["==", ["get", "id"], "rosario"], "rgba(144,206,255,.24)", "rgba(126,194,255,.22)"],
      "fill-opacity": [
        "case",
        ["==", ["get", "id"], "buenos-aires"],
        scene === "customs" ? 0.34 : scene === "distribution" || scene === "delivered" ? 0.1 : 0.2,
        scene === "distribution" || scene === "delivered" ? 0.32 : scene === "customs" ? 0.08 : 0.2,
      ],
    },
  });
  map.addLayer({
    id: "tracking-city-outline",
    type: "line",
    source: "tracking-city-areas",
    paint: {
      "line-color": "rgba(219,244,255,.92)",
      "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1.5, 8, 2.4],
      "line-blur": 0.7,
      "line-opacity": 0.86,
    },
  });
}

function addMarkers(
  map: MapLibreMap,
  maplibregl: typeof import("maplibre-gl"),
  scene: NationalTrackingMapProps["scene"],
  markers: MapLibreMarker[],
) {
  const ba = cityMarker("Buenos Aires", scene !== "customs" && scene !== "route");
  const rosario = cityMarker("Rosario", scene === "customs");
  markers.push(
    new maplibregl.Marker({ element: ba, anchor: "center" }).setLngLat(BUENOS_AIRES).addTo(map),
    new maplibregl.Marker({ element: rosario, anchor: "center" }).setLngLat(ROSARIO).addTo(map),
  );
  if (scene !== "customs") {
    const tag = document.createElement("div");
    tag.className = styles.routeTag;
    tag.textContent = "Ruta 9";
    markers.push(
      new maplibregl.Marker({ element: tag, anchor: "center" })
        .setLngLat([-59.55, -33.63])
        .addTo(map),
    );
  }
}

function cityMarker(name: string, muted: boolean) {
  const element = document.createElement("div");
  element.className = `${styles.realCityMarker}${muted ? ` ${styles.realCityMuted}` : ""}`;
  element.innerHTML = `<div class="${styles.realCityHalo}"></div><div class="${styles.realCityDot}"></div><div class="${styles.realCityLabel}">${name}</div>`;
  return element;
}

function addClouds(
  map: MapLibreMap,
  maplibregl: typeof import("maplibre-gl"),
  desktop: boolean,
  markers: MapLibreMarker[],
) {
  const factor = desktop ? 1 : 0.68;
  const clouds = [
    [-61.3, -34.35, 330, 0.24],
    [-61.18, -32.45, 260, 0.2],
    [-58, -32.8, 310, 0.22],
    [-57.72, -33.82, 250, 0.18],
    [-59.65, -35.18, 360, 0.23],
  ];
  clouds.forEach(([lng, lat, width, opacity], index) => {
    const host = document.createElement("div");
    host.className = styles.cloudHost;
    host.style.width = `${Number(width) * factor}px`;
    host.style.opacity = String(opacity);
    host.style.animationDelay = `${index * -9}s`;
    markers.push(
      new maplibregl.Marker({ element: host, anchor: "center" })
        .setLngLat([Number(lng), Number(lat)])
        .addTo(map),
    );
  });
}

async function addLandmarks(
  map: MapLibreMap,
  maplibregl: typeof import("maplibre-gl"),
) {
  const loader = new STLLoader();
  const [obelisk, monument] = await Promise.all([
    loader.loadAsync("/tracking/models/obelisk.stl"),
    loader.loadAsync("/tracking/models/flag-monument.stl"),
  ]);
  [obelisk, monument].forEach((geometry) => {
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    geometry.translate(-(box.min.x + box.max.x) / 2, -(box.min.y + box.max.y) / 2, -box.min.z);
  });

  const camera = new THREE.Camera();
  const scene = new THREE.Scene();
  let renderer: THREE.WebGLRenderer;
  const configs = [
    { geometry: obelisk, color: 0xf2ebde, lngLat: [-58.3817, -34.603] as [number, number], scale: 950, yaw: Math.PI * 0.08 },
    { geometry: monument, color: 0xc8b499, lngLat: [-60.6309, -32.9479] as [number, number], scale: 420, yaw: Math.PI * 0.24 },
  ];

  map.addLayer({
    id: "tracking-landmarks",
    type: "custom",
    renderingMode: "3d",
    onAdd(mapInstance, gl) {
      renderer = new THREE.WebGLRenderer({ canvas: mapInstance.getCanvas(), context: gl, antialias: true });
      renderer.autoClear = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const ambient = new THREE.AmbientLight(0xf1f6ff, 1.8);
      const sun = new THREE.DirectionalLight(0xfff4e6, 1.6);
      sun.position.set(120, -80, 180);
      scene.add(ambient, sun);
      configs.forEach((config) => {
        const mercator = maplibregl.MercatorCoordinate.fromLngLat(config.lngLat, 0);
        const scale = mercator.meterInMercatorCoordinateUnits() * config.scale;
        const mesh = new THREE.Mesh(
          config.geometry,
          new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.9 }),
        );
        mesh.rotation.set(0, 0, config.yaw);
        mesh.scale.set(scale, -scale, scale);
        mesh.position.set(mercator.x, mercator.y, mercator.z);
        scene.add(mesh);
      });
    },
    render(_gl, args) {
      camera.projectionMatrix = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);
      renderer.resetState();
      renderer.render(scene, camera);
      map.triggerRepaint();
    },
    onRemove() {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
    },
  });
}

function animateRoute(map: MapLibreMap) {
  const start = performance.now();
  let active = true;
  let frame = 0;
  const animate = (now: number) => {
    if (!active || !map.getLayer("tracking-route-progress")) return;
    const cycle = ((now - start) % 7600) / 7600;
    const amount = cycle < 0.82 ? 1 - Math.pow(1 - cycle / 0.82, 3) : 1;
    map.setPaintProperty("tracking-route-progress", "line-gradient", routeGradient(amount));
    frame = requestAnimationFrame(animate);
  };
  frame = requestAnimationFrame(animate);
  return () => {
    active = false;
    cancelAnimationFrame(frame);
  };
}

function routeGradient(value: number) {
  const head = Math.max(0, Math.min(1, value));
  const tail = Math.max(0.001, Math.min(0.82, head - 0.2));
  const glow = Math.max(tail + 0.02, Math.min(0.94, head - 0.055));
  const stop = Math.max(glow + 0.001, Math.min(0.985, head));
  const fade = Math.max(stop + 0.001, Math.min(0.995, head + 0.045));
  return [
    "interpolate",
    ["linear"],
    ["line-progress"],
    0,
    "rgba(75,165,255,.20)",
    tail,
    "rgba(75,165,255,.26)",
    glow,
    "rgba(111,205,255,.92)",
    stop,
    "rgba(255,255,255,.98)",
    fade,
    "rgba(111,205,255,0)",
    1,
    "rgba(111,205,255,0)",
  ] as maplibregl.ExpressionSpecification;
}

function ellipse(
  id: string,
  [lng, lat]: [number, number],
  radiusLng: number,
  radiusLat: number,
) {
  const coordinates = Array.from({ length: 49 }, (_, index) => {
    const angle = (index / 48) * Math.PI * 2;
    return [lng + Math.cos(angle) * radiusLng, lat + Math.sin(angle) * radiusLat];
  });
  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: [coordinates] },
    properties: { id },
  };
}
