import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Html,
  OrbitControls,
  PerformanceMonitor,
  useProgress,
} from "@react-three/drei";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import { ScenePostProcessing } from "./three/ScenePostProcessing";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useGLTF } from "../three/useGLTF";
import { useProgressiveModel } from "./three/useProgressiveModel";
import { MODEL_LOD_URLS } from "./three/towerModelUrls";
import { AmbientAudioToggle } from "./AmbientAudioToggle";

const AUTO_ROTATE_SPEED = 0.4; // rad/s
const IDLE_RESUME_MS = 3000;
const MIN_POLAR = Math.PI * 0.18;
const MAX_POLAR = Math.PI * 0.62;
const TWEEN_DURATION = 1.1; // seconds for cinematic waypoint transition

export type Waypoint = {
  label: string;
  azimuth: number;
  polar: number;
  radius: number;
};

export type Hotspot = {
  id: string;
  label: string;
  description?: string;
  position: [number, number, number];
  waypoint?: Waypoint;
};

type TowerOrbitViewerProps = {
  modelUrl: string;
  waypoints?: Waypoint[];
  hotspots?: Hotspot[];
  ariaLabel?: string;
  className?: string;
};

/* ---------- accessibility: prefers-reduced-motion ---------- */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/* ---------- tower model with optional sway ---------- */
function OrbitTowerModel({
  url,
  animate,
  onHotspotClick,
  hotspots,
}: {
  url: string;
  animate: boolean;
  hotspots?: Hotspot[];
  onHotspotClick?: (h: Hotspot) => void;
}) {
  // Progressive load: tiny -lod2 tier first, swap to full res when decoded.
  const { url: activeUrl, isLowRes } = useProgressiveModel(url);
  const { scene } = useGLTF(activeUrl);
  // Low tier doubles as the far distance-LOD level once full res is active.
  const lowUrl = MODEL_LOD_URLS[url]?.lod2 ?? activeUrl;
  const { scene: lowScene } = useGLTF(lowUrl);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const swayRef = useRef<THREE.Group>(null);

  useEffect(() => {
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
  }, [cloned]);

  const centered = useMemo(() => {
    const group = new THREE.Group();
    let visual: THREE.Object3D = cloned;
    if (!isLowRes && lowScene !== scene) {
      // Both tiers are already in the drei cache — the LOD costs no extra
      // download and drops ~90% of triangles when the camera is zoomed out.
      const lod = new THREE.LOD();
      const low = lowScene.clone(true);
      low.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });
      lod.addLevel(cloned, 0);
      lod.addLevel(low, 11);
      visual = lod;
    }
    group.add(visual);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 3.5 / maxDim;
    visual.position.sub(center);
    visual.position.y += size.y * 0.5;
    group.scale.setScalar(scale);
    return group;
  }, [cloned, isLowRes, lowScene, scene]);

  useFrame(({ clock }) => {
    const g = swayRef.current;
    if (!g) return;
    if (!animate) {
      g.rotation.z = 0;
      g.rotation.x = 0;
      return;
    }
    const t = clock.getElapsedTime();
    g.rotation.z =
      Math.sin((t / 12) * Math.PI * 2) * THREE.MathUtils.degToRad(0.5);
    g.rotation.x =
      Math.sin((t / 9) * Math.PI * 2) * THREE.MathUtils.degToRad(0.35);
  });

  return (
    <group ref={swayRef}>
      <primitive object={centered} />
      {hotspots?.map((h) => (
        <group key={h.id} position={h.position}>
          <Html center distanceFactor={8} zIndexRange={[10, 0]}>
            <button
              type="button"
              className="tower-orbit-viewer__hotspot"
              onClick={(e) => {
                e.stopPropagation();
                onHotspotClick?.(h);
              }}
              aria-label={`${h.label}${h.description ? " — " + h.description : ""}`}
            >
              <span className="tower-orbit-viewer__hotspot-dot" />
              <span className="tower-orbit-viewer__hotspot-label">
                {h.label}
              </span>
            </button>
          </Html>
        </group>
      ))}
    </group>
  );
}

/* ---------- dust motes (skipped when reduced motion) ---------- */
function DustMotes({ count = 150 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 12,
        y: 0.3 + Math.random() * 4.5,
        z: (Math.random() - 0.5) * 12,
        speed: 0.05 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2,
        radius: 0.4 + Math.random() * 1.4,
      })),
    [count]
  );

  useFrame(({ clock }) => {
    const m = meshRef.current;
    if (!m) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const drift = Math.sin(t * s.speed + s.phase);
      dummy.position.set(
        s.x + Math.cos(t * s.speed * 0.6 + s.phase) * s.radius,
        s.y + drift * 0.35,
        s.z + Math.sin(t * s.speed * 0.5 + s.phase) * s.radius
      );
      const scale = 0.008 + (0.5 + 0.5 * drift) * 0.006;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#fff5d6"
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

/* ---------- sun arc (skipped when reduced motion) ---------- */
function SunArc({
  sunRef,
  radius = 12,
}: {
  sunRef: React.MutableRefObject<THREE.DirectionalLight | null>;
  radius?: number;
}) {
  const { scene } = useThree();
  useFrame(({ clock }) => {
    const light = sunRef.current;
    if (!light) return;
    const t = (clock.getElapsedTime() % 60) / 60;
    const az = THREE.MathUtils.lerp(-Math.PI * 0.55, Math.PI * 0.55, t);
    const elev = Math.sin(t * Math.PI) * 0.9 + 0.15;
    light.position.set(
      Math.cos(elev) * Math.sin(az) * radius,
      Math.sin(elev) * radius,
      Math.cos(elev) * Math.cos(az) * radius
    );
    const warmth = 1 - Math.sin(t * Math.PI);
    light.color.setRGB(1, 1 - warmth * 0.18, 1 - warmth * 0.34);
    light.intensity = 1.8 + Math.sin(t * Math.PI) * 1.2;
    if ((scene as THREE.Scene).environmentIntensity !== undefined) {
      (scene as THREE.Scene).environmentIntensity =
        0.55 + Math.sin(t * Math.PI) * 0.35;
    }
  });
  return null;
}

/* ---------- auto-rotate (skipped when paused or reduced motion) ---------- */
function AutoRotateBridge({
  controlsRef,
  paused,
}: {
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  paused: boolean;
}) {
  useFrame((_, dt) => {
    const c = controlsRef.current;
    if (!c || paused) return;
    const target = c.target;
    const cam = c.object as THREE.PerspectiveCamera;
    const offset = new THREE.Vector3().subVectors(cam.position, target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta += AUTO_ROTATE_SPEED * dt;
    offset.setFromSpherical(spherical);
    cam.position.copy(target).add(offset);
    cam.lookAt(target);
    c.update();
  });
  return null;
}

/* ---------- cinematic waypoint tween ---------- */
type TweenTarget = {
  from: THREE.Spherical;
  to: THREE.Spherical;
  elapsed: number;
  duration: number;
};

function CameraTween({
  controlsRef,
  tweenRef,
}: {
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  tweenRef: React.MutableRefObject<TweenTarget | null>;
}) {
  useFrame((_, dt) => {
    const c = controlsRef.current;
    const tw = tweenRef.current;
    if (!c || !tw) return;
    tw.elapsed = Math.min(tw.elapsed + dt, tw.duration);
    const t = tw.elapsed / tw.duration;
    // easeInOutCubic
    const k = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const s = new THREE.Spherical(
      THREE.MathUtils.lerp(tw.from.radius, tw.to.radius, k),
      THREE.MathUtils.lerp(tw.from.phi, tw.to.phi, k),
      THREE.MathUtils.lerp(tw.from.theta, tw.to.theta, k)
    );
    const cam = c.object as THREE.PerspectiveCamera;
    const offset = new THREE.Vector3().setFromSpherical(s);
    cam.position.copy(c.target).add(offset);
    cam.lookAt(c.target);
    c.update();
    if (tw.elapsed >= tw.duration) tweenRef.current = null;
  });
  return null;
}

/* ---------- reset ---------- */
function ResetHandler({
  controlsRef,
  trigger,
  home,
}: {
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  trigger: number;
  home: { position: THREE.Vector3; target: THREE.Vector3 };
}) {
  const { camera } = useThree();
  useEffect(() => {
    const c = controlsRef.current;
    if (!c || trigger === 0) return;
    camera.position.copy(home.position);
    c.target.copy(home.target);
    c.update();
  }, [trigger, camera, controlsRef, home]);
  return null;
}

/* ---------- loading overlay ---------- */
function LoadingOverlay() {
  const { active, progress } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className="tower-orbit-viewer__loader" role="status" aria-live="polite">
      <div className="tower-orbit-viewer__loader-ring" />
      <div className="tower-orbit-viewer__loader-text">
        Loading model {Math.round(progress)}%
      </div>
    </div>
  );
}

export function TowerOrbitViewer({
  modelUrl,
  waypoints,
  hotspots,
  ariaLabel = "Interactive 360 degree tower viewer",
  className,
}: TowerOrbitViewerProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const sunRef = useRef<THREE.DirectionalLight | null>(null);
  const tweenRef = useRef<TweenTarget | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const resumeTimer = useRef<number | null>(null);

  const reducedMotion = usePrefersReducedMotion();

  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState(
    reducedMotion
      ? "Idle. Reduced motion enabled."
      : "Idle. Auto-rotating."
  );
  const [resetTrigger, setResetTrigger] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dpr, setDpr] = useState<[number, number]>([1, 1.5]);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [postFxEnabled, setPostFxEnabled] = useState(true);

  const home = useMemo(
    () => ({
      position: new THREE.Vector3(6, 2.4, 6),
      target: new THREE.Vector3(0, 1.5, 0),
    }),
    []
  );

  /* pause when tab hidden or off-screen */
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    io.observe(el);
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const pauseThenResume = useCallback(() => {
    setPaused(true);
    setStatus("Paused — interacting.");
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    if (reducedMotion) return; // never auto-resume rotation when reduced motion
    resumeTimer.current = window.setTimeout(() => {
      setPaused(false);
      setStatus("Idle. Auto-rotating.");
    }, IDLE_RESUME_MS);
  }, [reducedMotion]);

  useEffect(
    () => () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    },
    []
  );

  const nudge = useCallback(
    (deltaAz: number, deltaPolar: number, deltaZoom: number) => {
      const c = controlsRef.current;
      if (!c) return;
      const cam = c.object as THREE.PerspectiveCamera;
      const offset = new THREE.Vector3().subVectors(cam.position, c.target);
      const sph = new THREE.Spherical().setFromVector3(offset);
      sph.theta += deltaAz;
      sph.phi = THREE.MathUtils.clamp(
        sph.phi + deltaPolar,
        MIN_POLAR,
        MAX_POLAR
      );
      sph.radius = THREE.MathUtils.clamp(
        sph.radius * (1 + deltaZoom),
        3,
        14
      );
      offset.setFromSpherical(sph);
      cam.position.copy(c.target).add(offset);
      cam.lookAt(c.target);
      c.update();
      pauseThenResume();
    },
    [pauseThenResume]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case "ArrowLeft":
          nudge(-0.12, 0, 0);
          setStatus("Orbiting left.");
          break;
        case "ArrowRight":
          nudge(0.12, 0, 0);
          setStatus("Orbiting right.");
          break;
        case "ArrowUp":
          nudge(0, -0.08, 0);
          setStatus("Tilting up.");
          break;
        case "ArrowDown":
          nudge(0, 0.08, 0);
          setStatus("Tilting down.");
          break;
        case "+":
        case "=":
          nudge(0, 0, -0.1);
          setStatus("Zooming in.");
          break;
        case "-":
        case "_":
          nudge(0, 0, 0.1);
          setStatus("Zooming out.");
          break;
        case "0":
          setResetTrigger((t) => t + 1);
          setStatus("View reset.");
          pauseThenResume();
          break;
        default:
          return;
      }
      e.preventDefault();
    },
    [nudge, pauseThenResume]
  );

  const goToWaypoint = useCallback(
    (wp: Waypoint) => {
      const c = controlsRef.current;
      if (!c) return;
      const cam = c.object as THREE.PerspectiveCamera;
      const offset = new THREE.Vector3().subVectors(cam.position, c.target);
      const from = new THREE.Spherical().setFromVector3(offset);
      const to = new THREE.Spherical(wp.radius, wp.polar, wp.azimuth);
      if (reducedMotion) {
        const off = new THREE.Vector3().setFromSpherical(to);
        cam.position.copy(c.target).add(off);
        cam.lookAt(c.target);
        c.update();
      } else {
        tweenRef.current = {
          from,
          to,
          elapsed: 0,
          duration: TWEEN_DURATION,
        };
      }
      setStatus(`Waypoint: ${wp.label}.`);
      pauseThenResume();
    },
    [pauseThenResume, reducedMotion]
  );

  const framePaused = paused || !visible;
  const enableSway = !reducedMotion && visible;

  return (
    <div
      ref={rootRef}
      className={className ?? "tower-orbit-viewer"}
      role="application"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 420,
        outline: "none",
      }}
    >
      <Canvas
        shadows
        dpr={dpr}
        style={{ position: "absolute", inset: 0 }}
        frameloop={visible ? "always" : "demand"}
        camera={{
          position: home.position.toArray(),
          fov: 38,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        onPointerDown={pauseThenResume}
        onWheel={pauseThenResume}
      >
        <PerformanceMonitor
          onIncline={() => setDpr([1, Math.min(window.devicePixelRatio, 2)])}
          onDecline={() => {
            setDpr([1, 1]);
            setPostFxEnabled(false);
          }}
        />
        <color attach="background" args={["#f5f5f7"]} />
        <fog attach="fog" args={["#f5f5f7", 26, 70]} />
        <ambientLight intensity={0.35} />
        <directionalLight
          ref={sunRef as never}
          castShadow
          position={[6, 8, 4]}
          intensity={2.4}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0005}
          shadow-normalBias={0.02}
        />
        {!reducedMotion && <SunArc sunRef={sunRef} />}
        <Suspense fallback={null}>
          <Environment preset="sunset" environmentIntensity={0.75} />
          <OrbitTowerModel
            url={modelUrl}
            animate={enableSway}
            hotspots={hotspots}
            onHotspotClick={(h) => {
              if (h.waypoint) goToWaypoint(h.waypoint);
              setActiveHotspot((prev) => (prev?.id === h.id ? null : h));
              setStatus(`Hotspot: ${h.label}.`);
            }}
          />
        </Suspense>
        {!reducedMotion && <DustMotes count={120} />}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[40, 40]} />
          <shadowMaterial transparent opacity={0.28} />
        </mesh>

        <OrbitControls
          ref={controlsRef as never}
          enablePan={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={MIN_POLAR}
          maxPolarAngle={MAX_POLAR}
          minDistance={3}
          maxDistance={14}
          target={home.target}
        />
        {!reducedMotion && (
          <AutoRotateBridge controlsRef={controlsRef} paused={framePaused} />
        )}
        <CameraTween controlsRef={controlsRef} tweenRef={tweenRef} />
        <ResetHandler
          controlsRef={controlsRef}
          trigger={resetTrigger}
          home={home}
        />
        {!reducedMotion ? (
          <ScenePostProcessing enabled={postFxEnabled} />
        ) : null}
      </Canvas>

      {waypoints && waypoints.length > 0 ? (
        <div
          className="tower-orbit-viewer__waypoints"
          role="group"
          aria-label="Guided tour"
        >
          {waypoints.map((wp) => (
            <button
              key={wp.label}
              type="button"
              onClick={() => goToWaypoint(wp)}
              className="tower-orbit-viewer__wp"
            >
              {wp.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="tower-orbit-viewer__controls" role="group" aria-label="View controls">
        <button
          type="button"
          className="tower-orbit-viewer__ctl"
          onClick={() => nudge(0, 0, -0.15)}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className="tower-orbit-viewer__ctl"
          onClick={() => nudge(0, 0, 0.15)}
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          className="tower-orbit-viewer__ctl"
          onClick={() => {
            setResetTrigger((t) => t + 1);
            setStatus("View reset.");
            pauseThenResume();
          }}
          aria-label="Reset view"
        >
          ⟳
        </button>
        <AmbientAudioToggle className="tower-orbit-viewer__ctl" />
      </div>

      <AnimatePresence>
        {activeHotspot ? (
          <motion.aside
            key={activeHotspot.id}
            className="tower-orbit-viewer__spec-card"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            role="dialog"
            aria-label={`${activeHotspot.label} details`}
          >
            <div className="tower-orbit-viewer__spec-head">
              <h3 className="tower-orbit-viewer__spec-title">
                {activeHotspot.label}
              </h3>
              <button
                type="button"
                className="tower-orbit-viewer__spec-close"
                onClick={() => setActiveHotspot(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </div>
            {activeHotspot.description ? (
              <p className="tower-orbit-viewer__spec-body">
                {activeHotspot.description}
              </p>
            ) : null}
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <div className="tower-orbit-viewer__hint" aria-hidden>
        Drag to orbit · Scroll/pinch to zoom · Arrow keys · 0 to reset
      </div>
      <div className="visually-hidden" aria-live="polite">
        {status}
      </div>
      <LoadingOverlay />
    </div>
  );
}
