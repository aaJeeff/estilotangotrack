"use client";

import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { InternationalGlobe } from "./international-globe";
import { NationalTrackingMap } from "./national-tracking-map";
import { trackingSceneForStatus } from "./tracking-state";
import type { TrackingExperienceData } from "./tracking-types";
import styles from "./tracking-experience.module.css";

const COLLAPSED = 66;
const EXPANDED = 34;
const SNAP_DURATION = 960;

export function TrackingExperience({ data }: { data: TrackingExperienceData }) {
  const scene = trackingSceneForStatus(data.status, data.progress);
  const [sheetY, setSheetY] = useState(COLLAPSED);
  const [expanded, setExpanded] = useState(false);
  const drag = useRef({ active: false, startY: 0, startSheetY: COLLAPSED, moved: false });
  const sheetYRef = useRef(COLLAPSED);
  const animationFrame = useRef(0);
  const sheetProgress = (COLLAPSED - sheetY) / (COLLAPSED - EXPANDED);

  useEffect(() => () => cancelAnimationFrame(animationFrame.current), []);

  const setSheetPosition = (value: number) => {
    sheetYRef.current = value;
    setSheetY(value);
  };

  const animateSheetTo = (target: number) => {
    cancelAnimationFrame(animationFrame.current);
    const start = sheetYRef.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSheetPosition(target);
      return;
    }
    const startedAt = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min(1, (now - startedAt) / SNAP_DURATION);
      const eased = appleEase(elapsed);
      setSheetPosition(start + (target - start) * eased);
      if (elapsed < 1) animationFrame.current = requestAnimationFrame(tick);
    };
    animationFrame.current = requestAnimationFrame(tick);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    cancelAnimationFrame(animationFrame.current);
    drag.current = {
      active: true,
      startY: event.clientY,
      startSheetY: sheetYRef.current,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current.active) return;
    const delta = event.clientY - drag.current.startY;
    if (Math.abs(delta) > 5) drag.current.moved = true;
    const next = Math.max(
      EXPANDED,
      Math.min(COLLAPSED, drag.current.startSheetY + (delta / window.innerHeight) * 100),
    );
    setSheetPosition(next);
  };

  const handlePointerUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const nextExpanded = drag.current.moved
      ? sheetYRef.current < (COLLAPSED + EXPANDED) / 2
      : !expanded;
    setExpanded(nextExpanded);
    animateSheetTo(nextExpanded ? EXPANDED : COLLAPSED);
  };

  return (
    <main className={styles.stage} data-scene={scene.scene} data-step={scene.step}>
      <section className={styles.desktopRoutePanel} aria-label="Ruta del pedido">
        <span className={styles.routeKicker}>{scene.routeKicker}</span>
        <div className={styles.routeLine}>
          <span>{scene.routeStart}</span>
          {scene.routeEnd && <span className={styles.routeArrow}>→</span>}
          {scene.routeEnd && <span>{scene.routeEnd}</span>}
        </div>
      </section>

      <section className={styles.mapShell} aria-label="Visualización del recorrido del pedido">
        {scene.scene === "international" && (
          <InternationalGlobe
            key={scene.step}
            progress={scene.progress}
            activeRoute={scene.activeRoute}
            sheetProgress={sheetProgress}
          />
        )}
        {scene.scene !== "international" && scene.scene !== "cancelled" && (
          <NationalTrackingMap
            key={scene.step}
            scene={scene.scene}
            sheetProgress={sheetProgress}
          />
        )}
        {scene.scene === "cancelled" && <div className={styles.cancelledScene} aria-hidden />}
        <div className={styles.sceneAtmosphere} aria-hidden />
        <div className={styles.mobileRoutePill}>
          <span className={styles.routeSpark} />
          {scene.routeEnd ? `${shortPlace(scene.routeStart)} → ${shortPlace(scene.routeEnd)}` : scene.routeStart}
        </div>
      </section>

      <section
        className={`${styles.sheet}${expanded ? ` ${styles.sheetExpanded}` : ""}`}
        aria-label="Detalle del pedido"
        style={{ transform: `translateY(${sheetY}%)` }}
      >
        <button
          type="button"
          className={styles.grabberArea}
          aria-label={expanded ? "Contraer detalle" : "Expandir detalle"}
          aria-expanded={expanded}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <span className={styles.grabber} />
        </button>

        <div className={styles.sheetContent}>
          <div className={styles.eyebrow}>Seguimiento del pedido</div>
          <h1>Pedido {data.orderNumber}</h1>
          <div className={styles.status}>
            <span className={styles.statusPulse} aria-hidden />
            {data.statusLabel}
          </div>

          <div className={styles.progressWrap}>
            <div className={styles.progressHead}>
              <div className={styles.percentage}>
                <AnimatedPercentage value={data.progress} /><span>%</span>
              </div>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label="Progreso del pedido"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={data.progress}
            >
              <AnimatedProgressFill value={data.progress} />
            </div>
          </div>
          <div className={styles.hint}>Deslizá para seguir el viaje</div>

          <section className={styles.sheetSection}>
            <h2>Estado del envío</h2>
            <div className={styles.card}>
              <div className={styles.timeline}>
                {data.timeline.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`${styles.timelineStep} ${styles[entry.state]}`}
                  >
                    {index < data.timeline.length - 1 && (
                      <span
                        className={`${styles.timelineConnector} ${connectorClass(entry.state, data.timeline[index + 1]?.state)}`}
                        aria-hidden
                      />
                    )}
                    <span className={styles.timelineNode} aria-hidden />
                    <div className={styles.timelineStepHead}>
                      <div>
                        <div className={styles.timelineName}>{entry.label}</div>
                        <div className={styles.timelineDate}>{entry.date}</div>
                      </div>
                      {entry.state === "current" && data.statusHelp && (
                        <Disclosure kind="inline" title="¿Qué significa?">
                          <p>{data.statusHelp}</p>
                        </Disclosure>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.sheetSection}>
            <h2>Entrega estimada</h2>
            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIcon} aria-hidden>
                <DeliveryIcon />
              </div>
              <div className={styles.deliveryCopy}>
                <div className={styles.deliveryTitle}>{data.estimatedTitle}</div>
                <div className={styles.deliveryDate}>{data.estimatedDate}</div>
              </div>
            </div>
          </section>

          <Disclosure
            kind="section"
            title="Productos incluidos"
            meta={`${data.products.length} productos`}
          >
            <div className={styles.card}>
              {data.products.map((product) => (
                <div key={product.id} className={styles.product}>
                  <div className={styles.jersey}>{product.marker}</div>
                  <div>
                    <div className={styles.productName}>{product.name}</div>
                    <div className={styles.productMeta}>{product.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </Disclosure>

          <Disclosure kind="section" title="Resumen económico" meta="Ver detalle">
            <div className={styles.card}>
              {data.summary.map((row) => (
                <div key={row.label} className={styles.summaryRow}>
                  <span>{row.label}</span>
                  <strong
                    className={
                      row.state === "complete"
                        ? styles.paidState
                        : row.state === "pending"
                          ? styles.pendingState
                          : undefined
                    }
                  >
                    {row.value}
                  </strong>
                </div>
              ))}
            </div>
          </Disclosure>
        </div>
      </section>
    </main>
  );
}

function Disclosure({
  kind,
  title,
  meta,
  children,
}: {
  kind: "inline" | "section";
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const section = kind === "section";

  return (
    <div
      className={`${section ? `${styles.sheetSection} ${styles.collapseSection}` : styles.inlineHelp}${open ? ` ${styles.disclosureOpen}` : ""}`}
    >
      <button
        type="button"
        className={section ? styles.collapseSummary : styles.inlineHelpButton}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{title}</span>
        {meta && <small>{meta}</small>}
      </button>
      <div id={contentId} className={styles.disclosurePanel} aria-hidden={!open}>
        <div className={styles.disclosureInner}>{children}</div>
      </div>
    </div>
  );
}

function connectorClass(
  current: "done" | "current" | "pending",
  next: "done" | "current" | "pending" | undefined,
) {
  if (current === "done" && next === "done") return styles.connectorDone;
  if (current === "done" && next === "current") return styles.connectorToCurrent;
  return styles.connectorPending;
}

function appleEase(value: number) {
  return cubicBezier(value, 0.19, 1, 0.22, 1);
}

function cubicBezier(value: number, x1: number, y1: number, x2: number, y2: number) {
  const sample = (t: number, a1: number, a2: number) =>
    ((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t * t + 3 * a1 * t;
  const slope = (t: number, a1: number, a2: number) =>
    3 * (1 - 3 * a2 + 3 * a1) * t * t + 2 * (3 * a2 - 6 * a1) * t + 3 * a1;
  let t = value;
  for (let iteration = 0; iteration < 5; iteration += 1) {
    const currentSlope = slope(t, x1, x2);
    if (Math.abs(currentSlope) < 0.000001) break;
    t -= (sample(t, x1, x2) - value) / currentSlope;
  }
  return sample(Math.max(0, Math.min(1, t)), y1, y2);
}

function AnimatedPercentage({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      const frame = requestAnimationFrame(() => setDisplayed(value));
      return () => cancelAnimationFrame(frame);
    }
    const startedAt = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const elapsed = Math.min(1, (now - startedAt) / 1200);
      const eased = 1 - Math.pow(1 - elapsed, 4);
      setDisplayed(Math.round(value * eased));
      if (elapsed < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return displayed;
}

function AnimatedProgressFill({ value }: { value: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setWidth(value));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [value]);

  return <div className={styles.progressFill} style={{ width: `${width}%` }} />;
}

function shortPlace(place: string) {
  return place.split(",")[0];
}

function DeliveryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 7.5h10.5v8.2H3z" fill="rgba(10,132,255,.70)" />
      <path d="M13.5 10h3.4l3.1 3.2v2.5h-6.5z" fill="rgba(255,255,255,.72)" />
      <circle cx="7" cy="17" r="1.8" fill="#12304a" />
      <circle cx="17.2" cy="17" r="1.8" fill="#12304a" />
      <path d="M4.2 5.8h8.2M5.1 10.1h4.8" stroke="rgba(255,255,255,.82)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
