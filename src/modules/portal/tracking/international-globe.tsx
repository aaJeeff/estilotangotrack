"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import styles from "./tracking-experience.module.css";

const GLOBE_RADIUS = 1.62;
const ROUTE_ALTITUDE = 0.035;
const GUANGZHOU = { lat: 23.1291, lng: 113.2644 };
const BUENOS_AIRES = { lat: -34.6037, lng: -58.3816 };

interface InternationalGlobeProps {
  progress: number;
  activeRoute: boolean;
  sheetProgress: number;
}

export function InternationalGlobe({
  progress,
  activeRoute,
  sheetProgress,
}: InternationalGlobeProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originLabelRef = useRef<HTMLDivElement>(null);
  const destinationLabelRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const sheetProgressRef = useRef(sheetProgress);

  useEffect(() => {
    sheetProgressRef.current = sheetProgress;
  }, [sheetProgress]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const originLabel = originLabelRef.current;
    const destinationLabel = destinationLabelRef.current;
    const location = locationRef.current;
    if (!host || !canvas || !originLabel || !destinationLabel || !location) return;

    let disposed = false;
    let frame = 0;
    let lastFrame = performance.now();
    let autoTourTime = 0;
    let pointerActive = false;
    let returningHome = false;
    let resumeAt = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const scene = new THREE.Scene();
    host.dataset.globeModel = "textured-fallback";
    scene.fog = new THREE.FogExp2(0x020711, 0.045);

    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;

    const textureLoader = new THREE.TextureLoader();
    const earthMap = textureLoader.load("/tracking/earth/earth_atmos_2048.jpg");
    const earthNormal = textureLoader.load("/tracking/earth/earth_normal_2048.jpg");
    const earthSpecular = textureLoader.load("/tracking/earth/earth_specular_2048.jpg");
    earthMap.colorSpace = THREE.SRGBColorSpace;
    earthMap.anisotropy = 8;
    earthNormal.anisotropy = 8;
    earthSpecular.anisotropy = 8;

    const globeGroup = new THREE.Group();
    const globeModelGroup = new THREE.Group();
    const trackingLayer = new THREE.Group();
    const fallbackEarth = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS, 128, 128),
      new THREE.MeshStandardMaterial({
        map: earthMap,
        normalMap: earthNormal,
        normalScale: new THREE.Vector2(0.042, 0.042),
        roughness: 0.5,
        metalness: 0,
        color: 0xf2ffff,
        emissive: 0x17344c,
        emissiveIntensity: 0.18,
      }),
    );
    const oceanTint = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS * 1.002, 128, 128),
      new THREE.MeshStandardMaterial({
        color: 0x8fe8ff,
        transparent: true,
        opacity: 0.22,
        roughness: 0.62,
        depthWrite: false,
      }),
    );
    globeModelGroup.add(fallbackEarth, oceanTint);
    globeGroup.add(globeModelGroup, trackingLayer);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS * 1.012, 128, 128),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        uniforms: {
          glowColor: { value: new THREE.Color(0x58baff) },
          coefficient: { value: 0.26 },
          power: { value: 2.25 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          uniform float coefficient;
          uniform float power;
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          void main() {
            vec3 cameraToVertex = normalize(vWorldPosition - cameraPosition);
            float intensity = pow(coefficient + dot(vNormal, cameraToVertex), power);
            gl_FragColor = vec4(glowColor, clamp(intensity, 0.0, 0.78));
          }
        `,
      }),
    );
    globeGroup.add(atmosphere);
    scene.add(globeGroup);

    scene.add(new THREE.HemisphereLight(0xf3fbff, 0x17344d, 2.75));
    const sun = new THREE.DirectionalLight(0xffffff, 5.45);
    sun.position.set(-2.6, 3.35, 4.9);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x8fcfff, 2.3);
    rim.position.set(3.4, -0.3, -2.4);
    scene.add(rim);
    const fillLight = new THREE.PointLight(0xd7f3ff, 1.25, 8);
    fillLight.position.set(0.2, 0.2, 4.8);
    scene.add(fillLight);

    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(360 * 3);
    for (let index = 0; index < 360; index += 1) {
      const radius = 8 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
      starPositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[index * 3 + 2] = -Math.abs(radius * Math.cos(phi)) - 2;
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    scene.add(
      new THREE.Points(
        starGeometry,
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.012,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.82,
        }),
      ),
    );

    const startSurface = latLngToVector3(GUANGZHOU.lat, GUANGZHOU.lng, GLOBE_RADIUS + 0.014);
    const endSurface = latLngToVector3(
      BUENOS_AIRES.lat,
      BUENOS_AIRES.lng,
      GLOBE_RADIUS + 0.014,
    );
    const routePoints = Array.from({ length: 190 }, (_, index) =>
      greatCirclePoint(startSurface, endSurface, index / 189),
    );
    const routeCurve = new THREE.CatmullRomCurve3(routePoints, false, "catmullrom", 0.12);
    const routeShadow = tube(routeCurve, 0.03, 0x102438, 0.3, 8);
    const routeBase = tube(routeCurve, 0.014, 0x9fe8ff, 0.5, 9);
    trackingLayer.add(routeShadow, routeBase);

    let renderedAmount = 0.02;
    let travelledCurve = travelledRoute(routePoints, renderedAmount);
    const travelledGlow = tube(travelledCurve, 0.05, 0x4dc6ff, 0.24, 10);
    const travelledLine = tube(travelledCurve, 0.023, 0xe9fbff, 0.98, 11);
    trackingLayer.add(travelledGlow, travelledLine);

    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    );
    pulse.add(new THREE.PointLight(0xbdeeff, 1.75, 1.05));
    pulse.renderOrder = 12;
    trackingLayer.add(pulse);

    const originPin = makePin(0xffffff, 0.027);
    originPin.position.copy(startSurface.clone().normalize().multiplyScalar(GLOBE_RADIUS * 1.014));
    const destinationPin = makePin(0xffffff, 0.027);
    destinationPin.position.copy(endSurface.clone().normalize().multiplyScalar(GLOBE_RADIUS * 1.014));
    trackingLayer.add(originPin, destinationPin);

    const originQuaternion = yawQuaternionForFocus(startSurface.clone().normalize());
    const destinationQuaternion = yawQuaternionForFocus(endSurface.clone().normalize());
    const originFlag = makeFlag(startSurface, "china", originQuaternion);
    const destinationFlag = makeFlag(endSurface, "argentina", destinationQuaternion);
    trackingLayer.add(originFlag, destinationFlag);

    const currentTourQuaternion = destinationQuaternion.clone();
    const interactionQuaternion = new THREE.Quaternion();
    const targetInteractionQuaternion = new THREE.Quaternion();
    globeGroup.quaternion.copy(destinationQuaternion);

    const updateTravelled = (amount: number) => {
      const clamped = THREE.MathUtils.clamp(amount, 0.015, 1);
      if (Math.abs(clamped - renderedAmount) < 0.006) return;
      renderedAmount = clamped;
      travelledCurve = travelledRoute(routePoints, clamped);
      travelledGlow.geometry.dispose();
      travelledLine.geometry.dispose();
      travelledGlow.geometry = new THREE.TubeGeometry(travelledCurve, 90, 0.05, 16, false);
      travelledLine.geometry = new THREE.TubeGeometry(travelledCurve, 90, 0.023, 16, false);
    };

    const routePointAt = (amount: number) => {
      const index = THREE.MathUtils.clamp(amount, 0, 1) * (routePoints.length - 1);
      const low = Math.floor(index);
      const high = Math.min(routePoints.length - 1, low + 1);
      return routePoints[low].clone().lerp(routePoints[high], index - low);
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const desktop = rect.width >= 900;
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.fov = desktop ? 39 : rect.width < 430 ? 45 : 40;
      camera.position.set(desktop ? -0.36 : 0, desktop ? 0.02 : 0.08, desktop ? 6.15 : 6.55);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const handlePointerDown = (event: PointerEvent) => {
      pointerActive = true;
      returningHome = false;
      resumeAt = performance.now() + 4200;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      host.setPointerCapture(event.pointerId);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerActive) return;
      const dx = event.clientX - lastPointerX;
      const dy = event.clientY - lastPointerY;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      targetInteractionQuaternion.premultiply(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.0085),
      );
      targetInteractionQuaternion.premultiply(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.0085),
      );
    };
    const handlePointerUp = () => {
      pointerActive = false;
      returningHome = true;
      resumeAt = performance.now() + 4200;
    };
    host.addEventListener("pointerdown", handlePointerDown);
    host.addEventListener("pointermove", handlePointerMove);
    host.addEventListener("pointerup", handlePointerUp);
    host.addEventListener("pointercancel", handlePointerUp);

    new GLTFLoader()
      .loadAsync("/tracking/models/physical-globe.glb")
      .then((gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.scale.setScalar((GLOBE_RADIUS * 2) / (Math.max(size.x, size.y, size.z) || 1));
        model.rotation.set(0, THREE.MathUtils.degToRad(90), 0);
        model.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.roughness = Math.min(0.82, material.roughness ?? 0.62);
              material.needsUpdate = true;
            }
          });
        });
        globeModelGroup.clear();
        globeModelGroup.add(model);
        host.dataset.globeModel = "physical-glb";
      })
      .catch(() => {
        // The textured sphere already in the scene is the intentional fallback.
      });

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targetProgress = THREE.MathUtils.clamp(progress / 100, 0, 1);

    const render = (now: number) => {
      if (disposed) return;
      const delta = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
      lastFrame = now;
      const paused = pointerActive || returningHome || now < resumeAt || prefersReducedMotion;
      if (!paused) autoTourTime += delta;
      const tour = getTourState(autoTourTime, originQuaternion, destinationQuaternion);

      if (returningHome) {
        targetInteractionQuaternion.slerp(new THREE.Quaternion(), 0.035);
        if (targetInteractionQuaternion.angleTo(new THREE.Quaternion()) < 0.003) {
          targetInteractionQuaternion.identity();
          returningHome = false;
        }
      }
      interactionQuaternion.slerp(targetInteractionQuaternion, pointerActive ? 0.22 : 0.075);
      currentTourQuaternion.slerp(paused ? destinationQuaternion : tour.camera, 0.035);
      const drift = prefersReducedMotion ? 0 : Math.sin(now * 0.00038) * 0.008;
      const rotation = currentTourQuaternion.clone();
      rotation.multiply(interactionQuaternion);
      rotation.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, drift, 0)));
      globeGroup.quaternion.copy(rotation);

      applyCameraMotion(camera, globeGroup, host.clientWidth, sheetProgressRef.current);

      const routeAmount = activeRoute && !paused ? tour.routeAmount : targetProgress;
      updateTravelled(routeAmount);
      const lightAmount = activeRoute && !paused ? tour.lightAmount : targetProgress;
      pulse.position.copy(routePointAt(Math.max(0.02, lightAmount)));
      pulse.visible = activeRoute && !paused;
      routeBase.material.opacity = 0.34 + Math.sin(now * 0.0016) * 0.05;
      renderer.render(scene, camera);
      updateOverlay(host, camera, globeGroup, originPin, originLabel, -34);
      updateOverlay(host, camera, globeGroup, destinationPin, destinationLabel, -18);
      updateLocation(host, camera, globeGroup, destinationPin, location);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("pointerdown", handlePointerDown);
      host.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerup", handlePointerUp);
      host.removeEventListener("pointercancel", handlePointerUp);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material?.dispose());
        }
      });
      earthMap.dispose();
      earthNormal.dispose();
      earthSpecular.dispose();
      renderer.dispose();
    };
  }, [activeRoute, progress]);

  return (
    <div ref={hostRef} className={styles.globeHost} aria-label="Recorrido internacional 3D">
      <canvas ref={canvasRef} className={styles.globeCanvas} />
      <div ref={originLabelRef} className={styles.mapLabel}>Guangzhou <small>CN</small></div>
      <div ref={destinationLabelRef} className={styles.mapLabel}>Buenos Aires <small>AR</small></div>
      <div ref={locationRef} className={styles.locationDot} aria-hidden />
    </div>
  );
}

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function greatCirclePoint(startPoint: THREE.Vector3, endPoint: THREE.Vector3, amount: number) {
  const start = startPoint.clone().normalize();
  const end = endPoint.clone().normalize();
  const omega = Math.acos(THREE.MathUtils.clamp(start.dot(end), -1, 1));
  const sinOmega = Math.sin(omega);
  if (sinOmega < 0.0001) return start.multiplyScalar(GLOBE_RADIUS);
  const point = start
    .multiplyScalar(Math.sin((1 - amount) * omega) / sinOmega)
    .add(end.multiplyScalar(Math.sin(amount * omega) / sinOmega))
    .normalize();
  return point.multiplyScalar(
    GLOBE_RADIUS + Math.sin(Math.PI * amount) * ROUTE_ALTITUDE + 0.012,
  );
}

function tube(
  curve: THREE.CatmullRomCurve3,
  radius: number,
  color: number,
  opacity: number,
  renderOrder: number,
) {
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 150, radius, 14, false),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
  );
  mesh.renderOrder = renderOrder;
  return mesh;
}

function travelledRoute(points: THREE.Vector3[], amount: number) {
  const count = Math.max(2, Math.round(points.length * THREE.MathUtils.clamp(amount, 0.015, 1)));
  return new THREE.CatmullRomCurve3(points.slice(0, count), false, "catmullrom", 0.12);
}

function makePin(color: number, size: number) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(size, 24, 24),
    new THREE.MeshBasicMaterial({ color }),
  );
}

function yawQuaternionForFocus(direction: THREE.Vector3) {
  return new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0, Math.atan2(-direction.x, direction.z), 0),
  );
}

function makeFlag(
  surfacePoint: THREE.Vector3,
  kind: "china" | "argentina",
  focus: THREE.Quaternion,
) {
  const normal = surfacePoint.clone().normalize();
  const group = new THREE.Group();
  group.position.copy(normal.clone().multiplyScalar(GLOBE_RADIUS * 1.046));
  const viewDirection = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(focus.clone().invert())
    .projectOnPlane(normal)
    .normalize();
  if (viewDirection.lengthSq() < 0.0001) {
    viewDirection.set(0, 0, 1).projectOnPlane(normal).normalize();
  }
  const xAxis = new THREE.Vector3().crossVectors(normal, viewDirection).normalize();
  const zAxis = new THREE.Vector3().crossVectors(xAxis, normal).normalize();
  group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, normal, zAxis));

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.0075, 0.34, 10),
    new THREE.MeshStandardMaterial({ color: 0xeef8ff, roughness: 0.38, metalness: 0.22 }),
  );
  mast.position.y = 0.162;
  const banner = makeFlagCloth(kind);
  banner.position.set(0.01, 0.3, 0.024);
  banner.rotation.y = THREE.MathUtils.degToRad(-18);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 18, 18),
    new THREE.MeshBasicMaterial({
      color: kind === "china" ? 0xffd15a : 0x82d8ff,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    }),
  );
  glow.position.y = 0.006;
  group.add(mast, banner, glow);
  return group;
}

function makeFlagCloth(kind: "china" | "argentina") {
  const group = new THREE.Group();
  const width = 0.238;
  const height = 0.15;
  const texture = makeFlagTexture(kind);
  const cloth = new THREE.Mesh(
    makeWavedFlagGeometry(width, height),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.54,
      metalness: 0.02,
      side: THREE.DoubleSide,
      emissive: kind === "china" ? 0x2d0502 : 0x071d2a,
      emissiveIntensity: 0.035,
    }),
  );
  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(makeWavedFlagGeometry(width, height)),
    new THREE.LineBasicMaterial({
      color: 0xf3fbff,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    }),
  );
  frame.position.z = 0.003;
  group.add(cloth, frame);
  return group;
}

function makeFlagTexture(kind: "china" | "argentina") {
  const canvas = document.createElement("canvas");
  canvas.width = 360;
  canvas.height = 240;
  const context = canvas.getContext("2d")!;
  context.save();
  context.beginPath();
  context.rect(0, 0, canvas.width, canvas.height);
  context.clip();

  if (kind === "china") {
    context.fillStyle = "#de2910";
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawCanvasStar(context, 72, 58, 32, "#ffde00", -Math.PI / 2);
    const smallStars = [
      [126, 27, -2.35],
      [148, 52, -2.85],
      [145, 84, 2.92],
      [119, 106, 2.46],
    ] as const;
    smallStars.forEach(([x, y, rotation]) =>
      drawCanvasStar(context, x, y, 10, "#ffde00", rotation),
    );
  } else {
    context.fillStyle = "#74acdf";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#fff";
    context.fillRect(0, 80, canvas.width, 80);
    context.fillStyle = "#f6b40e";
    context.beginPath();
    context.arc(180, 120, 21, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function drawCanvasStar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  rotation: number,
) {
  context.beginPath();
  for (let index = 0; index < 10; index += 1) {
    const pointRadius = index % 2 === 0 ? radius : radius * 0.4;
    const angle = rotation + (index * Math.PI) / 5;
    const pointX = x + Math.cos(angle) * pointRadius;
    const pointY = y + Math.sin(angle) * pointRadius;
    if (index === 0) context.moveTo(pointX, pointY);
    else context.lineTo(pointX, pointY);
  }
  context.closePath();
  context.fillStyle = color;
  context.fill();
}

function makeWavedFlagGeometry(width: number, height: number, yOffset = 0) {
  const segmentsX = 9;
  const segmentsY = 3;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let y = 0; y <= segmentsY; y += 1) {
    for (let x = 0; x <= segmentsX; x += 1) {
      const u = x / segmentsX;
      const v = y / segmentsY;
      positions.push(
        u * width,
        yOffset + (0.5 - v) * height,
        Math.sin(u * Math.PI * 2.15) * 0.012 * (0.25 + u),
      );
      uvs.push(u, v);
    }
  }
  const row = segmentsX + 1;
  for (let y = 0; y < segmentsY; y += 1) {
    for (let x = 0; x < segmentsX; x += 1) {
      const a = y * row + x;
      const b = a + row;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function getTourState(
  seconds: number,
  origin: THREE.Quaternion,
  destination: THREE.Quaternion,
) {
  const cycle = seconds % 28;
  if (cycle < 5.5) {
    const amount = easeInOut((cycle % 3.5) / 3.5);
    return { camera: destination, routeAmount: amount, lightAmount: amount };
  }
  if (cycle < 10) {
    const amount = easeInOut((cycle - 5.5) / 4.5);
    return {
      camera: destination.clone().slerp(origin, amount),
      routeAmount: easeInOut(((cycle - 5.5) % 3.8) / 3.8),
      lightAmount: amount,
    };
  }
  if (cycle < 18.5) {
    const amount = easeInOut((cycle - 10) / 8.5);
    return {
      camera: origin.clone().slerp(destination, amount),
      routeAmount: amount,
      lightAmount: amount,
    };
  }
  const amount = easeInOut(((cycle - 18.5) % 3.6) / 3.6);
  return { camera: destination, routeAmount: amount, lightAmount: amount };
}

function easeInOut(value: number) {
  const amount = THREE.MathUtils.clamp(value, 0, 1);
  return amount * amount * (3 - 2 * amount);
}

function applyCameraMotion(
  camera: THREE.PerspectiveCamera,
  globe: THREE.Group,
  width: number,
  sheetProgress: number,
) {
  const desktop = width >= 900;
  const mobile = width < 700;
  const smooth = THREE.MathUtils.clamp(sheetProgress, 0, 1);
  const baseFov = desktop ? 39 : mobile ? 45 : 40;
  const baseZ = desktop ? 6.15 : mobile ? 6.55 : 6.18;
  camera.position.x = desktop ? -0.36 : 0;
  camera.position.z = baseZ - smooth * (mobile ? 1.62 : 0.66);
  camera.position.y = (desktop ? 0.02 : 0.08) + smooth * (mobile ? 0.075 : 0.028);
  camera.fov = baseFov - smooth * (mobile ? 5.8 : 2.4);
  camera.updateProjectionMatrix();
  globe.scale.setScalar(1 + smooth * (mobile ? 0.045 : 0.018));
  globe.position.x = desktop ? 0.58 : 0;
  globe.position.y = mobile ? -smooth * 0.9 : -smooth * 0.24;
}

function project(
  host: HTMLElement,
  camera: THREE.Camera,
  globe: THREE.Group,
  object: THREE.Object3D,
) {
  object.updateWorldMatrix(true, false);
  const world = object.getWorldPosition(new THREE.Vector3());
  const normal = world.clone().sub(globe.getWorldPosition(new THREE.Vector3())).normalize();
  const facing = normal.dot(camera.position.clone().sub(world).normalize()) > -0.08;
  const vector = world.project(camera);
  const rect = host.getBoundingClientRect();
  return {
    x: (vector.x * 0.5 + 0.5) * rect.width,
    y: (-vector.y * 0.5 + 0.5) * rect.height,
    visible: vector.z < 1 && facing,
  };
}

function updateOverlay(
  host: HTMLElement,
  camera: THREE.Camera,
  globe: THREE.Group,
  object: THREE.Object3D,
  element: HTMLElement,
  offsetY: number,
) {
  const point = project(host, camera, globe, object);
  element.style.left = `${point.x}px`;
  element.style.top = `${point.y + offsetY}px`;
  element.dataset.visible = String(point.visible);
}

function updateLocation(
  host: HTMLElement,
  camera: THREE.Camera,
  globe: THREE.Group,
  object: THREE.Object3D,
  element: HTMLElement,
) {
  const point = project(host, camera, globe, object);
  element.style.left = `${point.x}px`;
  element.style.top = `${point.y}px`;
  element.dataset.visible = String(point.visible);
}
