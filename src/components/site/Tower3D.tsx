import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
  ContactShadows,
  Preload,
} from "@react-three/drei";
import * as THREE from "three";
import { towerModels } from "@/lib/assets";
import { ProceduralTowerEnvironment } from "../three/ProceduralTowerEnvironment";

const MODELS = {
  designer: towerModels.designer,
  utility: towerModels.utility,
} as const;

type ModelKey = keyof typeof MODELS;

type SkyStops = { zenith: string; mid: string; horizon: string };

const SKY_NIGHT: SkyStops = { zenith: "#060818", mid: "#141238", horizon: "#3a2858" };
const SKY_DAWN: SkyStops = { zenith: "#2e3a7a", mid: "#e8a8d0", horizon: "#ffd8b0" };
const SKY_DAY: SkyStops = { zenith: "#2e6eb5", mid: "#5a9fd4", horizon: "#9fd0ef" };

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpHex(a: string, b: string, t: number) {
  const c = new THREE.Color(a).lerp(new THREE.Color(b), t);
  return "#" + c.getHexString();
}

function lerpStops(a: SkyStops, b: SkyStops, t: number): SkyStops {
  return {
    zenith: lerpHex(a.zenith, b.zenith, t),
    mid: lerpHex(a.mid, b.mid, t),
    horizon: lerpHex(a.horizon, b.horizon, t),
  };
}

function sampleSky(p: number): SkyStops {
  const t = Math.max(0, Math.min(1, p));
  if (t < 0.5) {
    return lerpStops(SKY_NIGHT, SKY_DAWN, smoothstep(0, 0.5, t));
  }
  return lerpStops(SKY_DAWN, SKY_DAY, smoothstep(0.5, 1, t));
}

function sampleSun(p: number) {
  const t = Math.max(0, Math.min(1, p));
  const x = 8 + t * 84;
  const y = 32 - t * 8;
  const glow = 0.18 + t * 0.62;
  const coreA = 0.42 + t * 0.5;
  return { x, y, glow, coreA };
}

function sampleLighting(p: number) {
  const t = Math.max(0, Math.min(1, p));
  const az = lerp(-Math.PI * 0.45, Math.PI * 0.45, t);
  const alt = lerp(0.15, 1.05, smoothstep(0.15, 0.85, t));
  const radius = 9;
  const sun: [number, number, number] = [
    Math.sin(az) * radius,
    Math.max(0.4, Math.sin(alt) * 9),
    Math.cos(az) * radius * 0.6,
  ];
  const sunColor =
    t < 0.5
      ? lerpHex("#7d97d8", "#ffb27a", smoothstep(0, 0.5, t))
      : lerpHex("#ffb27a", "#fff4d6", smoothstep(0.5, 1, t));
  const sunIntensity = lerp(0.35, 2.6, smoothstep(0.12, 0.85, t));
  const ambient = lerp(0.18, 0.78, smoothstep(0.1, 0.85, t));
  const rim = lerpHex("#3a4a78", "#b6d4ff", t);
  const rimIntensity = lerp(0.35, 0.55, t);
  const shadowOpacity = lerp(0.2, 0.55, smoothstep(0.15, 0.7, t));
  return { sun, sunColor, sunIntensity, ambient, rim, rimIntensity, shadowOpacity };
}

function TowerModel({
  url,
  progressRef,
  draggingRef,
  reducedMotion,
  pin,
  autoRotateSpeed,
  modelScale = 1,
  initialRotationY = 0,
  sweepDeg,
}: {
  url: string;
  progressRef: React.MutableRefObject<number>;
  draggingRef: React.MutableRefObject<boolean>;
  reducedMotion: boolean;
  pin: boolean;
  autoRotateSpeed: number;
  modelScale?: number;
  initialRotationY?: number;
  sweepDeg?: number;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null!);
  const cloned = useRef<THREE.Group | null>(null);
  const driveRef = useRef(0);
  const idleRef = useRef(0);
  const spinRef = useRef(0);
  const sweepRef = useRef(0);

  if (!cloned.current) {
    cloned.current = scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned.current);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const targetHeight = 4.6 * modelScale;
    const fit = targetHeight / Math.max(size.y, 0.001);
    cloned.current.scale.setScalar(fit);
    cloned.current.position.set(-center.x * fit, -box.min.y * fit, -center.z * fit);
    cloned.current.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  }

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = initialRotationY + spinRef.current;
    }
  }, [initialRotationY]);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    if (draggingRef.current) return;

    if (pin) {
      const target = reducedMotion ? 0 : progressRef.current * Math.PI * 2;
      driveRef.current = lerp(driveRef.current, target, Math.min(1, dt * 3));
      idleRef.current += dt * 0.12;
      const idle = reducedMotion ? 0 : Math.sin(idleRef.current) * 0.03;
      groupRef.current.rotation.y = initialRotationY + driveRef.current + idle;
    } else if (!reducedMotion && sweepDeg) {
      // One graceful eased swing from the load pose to +sweepDeg, then settle.
      const duration = 6;
      sweepRef.current = Math.min(sweepRef.current + dt, duration);
      const p = sweepRef.current / duration;
      const eased = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
      const targetRad = (sweepDeg * Math.PI) / 180;
      groupRef.current.rotation.y = initialRotationY + targetRad * eased;
    } else if (!reducedMotion) {
      spinRef.current += dt * autoRotateSpeed;
      groupRef.current.rotation.y = initialRotationY + spinRef.current;
    } else {
      groupRef.current.rotation.y = initialRotationY;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.2, 0]}>
      <primitive object={cloned.current} />
    </group>
  );
}

function DynamicLighting({
  progressRef,
  reducedMotion,
}: {
  progressRef: React.MutableRefObject<number>;
  reducedMotion: boolean;
}) {
  const sunRef = useRef<THREE.DirectionalLight>(null!);
  const rimRef = useRef<THREE.DirectionalLight>(null!);
  const ambRef = useRef<THREE.AmbientLight>(null!);
  const shadowRef = useRef<any>(null);

  useFrame(() => {
    const p = reducedMotion ? 0.6 : progressRef.current;
    const L = sampleLighting(p);
    if (sunRef.current) {
      sunRef.current.position.set(L.sun[0], L.sun[1], L.sun[2]);
      sunRef.current.color.set(L.sunColor);
      sunRef.current.intensity = L.sunIntensity;
    }
    if (rimRef.current) {
      rimRef.current.color.set(L.rim);
      rimRef.current.intensity = L.rimIntensity;
    }
    if (ambRef.current) ambRef.current.intensity = L.ambient;
    if (shadowRef.current) shadowRef.current.opacity = L.shadowOpacity;
  });

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.6} />
      <hemisphereLight args={["#cfe1f1", "#2a1f3a", 0.4]} />
      <directionalLight
        ref={sunRef}
        castShadow
        position={[6, 9, 4]}
        intensity={2.1}
        color={"#fff1d6"}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight ref={rimRef} position={[-5, 3, -4]} intensity={0.5} color={"#b6d4ff"} />
      <ContactShadows
        ref={shadowRef}
        position={[0, -1.2, 0]}
        opacity={0.45}
        scale={9}
        blur={2.6}
        far={4.5}
        color={"#1a1230"}
      />
    </>
  );
}

useGLTF.preload(MODELS.designer);

function paintSky(el: HTMLDivElement, sunEl: HTMLDivElement | null, p: number) {
  const s = sampleSky(p);
  el.style.background = `linear-gradient(180deg, ${s.zenith} 0%, ${s.mid} 55%, ${s.horizon} 100%)`;
  if (sunEl) {
    const sun = sampleSun(p);
    sunEl.style.left = `${sun.x}%`;
    sunEl.style.top = `${sun.y}%`;
    sunEl.style.opacity = String(0.4 + sun.glow * 0.6);
    sunEl.style.background = `radial-gradient(circle, rgba(255,244,214,${sun.coreA}) 0%, rgba(255,200,120,${sun.coreA * 0.5}) 22%, rgba(255,170,90,0) 60%)`;
  }
}

const initialSkyCss = (() => {
  const s = SKY_NIGHT;
  return `linear-gradient(180deg, ${s.zenith} 0%, ${s.mid} 55%, ${s.horizon} 100%)`;
})();

export function Tower3D({
  variant = "designer",
  interactive = true,
  height = "100%",
  className = "",
  autoRotateSpeed = 0.3,
  modelScale = 1,
  initialRotationY = 0,
  sweepDeg,
  cameraPosition = [6.5, 4.2, 9.5],
  cameraTarget = [0, 1, 0],
  cameraFov = 35,
  pin = false,
  pinHeight = "220vh",
  showSky = true,
  showHint = true,
  children,
}: {
  variant?: ModelKey;
  interactive?: boolean;
  height?: string | number;
  className?: string;
  autoRotateSpeed?: number;
  modelScale?: number;
  initialRotationY?: number;
  sweepDeg?: number;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  cameraFov?: number;
  pin?: boolean;
  pinHeight?: string | number;
  showSky?: boolean;
  showHint?: boolean;
  children?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const outerRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const skyRef = useRef<HTMLDivElement | null>(null);
  const sunRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const draggingRef = useRef(false);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReducedMotion(mq.matches);
    onMq();
    mq.addEventListener?.("change", onMq);
    return () => mq.removeEventListener?.("change", onMq);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let raf = 0;
    const compute = () => {
      raf = 0;
      const driver = pin ? outerRef.current : wrapRef.current;
      if (!driver) return;
      const r = driver.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      let p: number;
      if (pin) {
        const travel = Math.max(1, r.height - vh);
        p = Math.min(1, Math.max(0, -r.top / travel));
      } else {
        const total = r.height + vh;
        const traveled = vh - r.top;
        p = Math.min(1, Math.max(0, traveled / total));
      }
      progressRef.current = reducedMotion ? 0.6 : p;
      if (skyRef.current) paintSky(skyRef.current, sunRef.current, progressRef.current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mounted, reducedMotion, pin]);

  useEffect(() => {
    if (!mounted) return;
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setVisible(e.isIntersecting)),
      { rootMargin: "100px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  const stickyStyle = useMemo<React.CSSProperties>(
    () => (pin ? { position: "sticky", top: 0, height: "100vh" } : { height }),
    [pin, height],
  );

  if (!mounted) {
    return (
      <div ref={outerRef} className={className} style={pin ? { height: pinHeight } : undefined}>
        <div
          ref={wrapRef}
          className="relative overflow-hidden"
          style={{ ...stickyStyle, background: showSky ? initialSkyCss : undefined }}
          aria-hidden
        />
      </div>
    );
  }

  const viewer = (
    <div
      ref={wrapRef}
      className="relative overflow-hidden"
      style={{ ...stickyStyle, borderRadius: "inherit" }}
    >
      {showSky && (
        <>
          <div ref={skyRef} className="absolute inset-0" style={{ background: initialSkyCss }} aria-hidden />
          <div
            ref={sunRef}
            className="absolute pointer-events-none"
            style={{
              width: "260px",
              height: "260px",
              left: "8%",
              top: "32%",
              transform: "translate(-50%, -50%)",
              filter: "blur(2px)",
            }}
            aria-hidden
          />
        </>
      )}
      <Canvas
        shadows
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "demand"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: cameraPosition, fov: cameraFov }}
        style={{ position: "absolute", inset: 0 }}
      >
        <PerspectiveCamera makeDefault position={cameraPosition} fov={cameraFov} />
        <Suspense fallback={null}>
          <DynamicLighting progressRef={progressRef} reducedMotion={reducedMotion} />
          <TowerModel
            url={MODELS[variant]}
            progressRef={progressRef}
            draggingRef={draggingRef}
            reducedMotion={reducedMotion}
            pin={pin}
            autoRotateSpeed={autoRotateSpeed}
            modelScale={modelScale}
            initialRotationY={initialRotationY}
            sweepDeg={sweepDeg}
          />
          <ProceduralTowerEnvironment environmentIntensity={0.35} environmentResolution={128} />
          <Preload all />
        </Suspense>
        {interactive && (
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 3.4}
            maxPolarAngle={Math.PI / 2.05}
            autoRotate={false}
            target={cameraTarget}
            onStart={() => {
              draggingRef.current = true;
            }}
            onEnd={() => {
              setTimeout(() => {
                draggingRef.current = false;
              }, 800);
            }}
          />
        )}
      </Canvas>
      {interactive && showHint && !children && (
        <div
          className={`tower3d-hint pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 ${
            showSky ? "tower3d-hint--sky" : "tower3d-hint--surface"
          }`}
        >
          {pin ? "Scroll to cycle day · drag to orbit" : "Scroll & drag"}
        </div>
      )}
      {children && <div className="absolute inset-0 z-10 pointer-events-none">{children}</div>}
    </div>
  );

  if (pin) {
    return (
      <div ref={outerRef} className={`relative ${className}`} style={{ height: pinHeight }}>
        {viewer}
      </div>
    );
  }

  return (
    <div ref={outerRef} className={`relative ${className}`} style={{ height }}>
      {viewer}
    </div>
  );
}
