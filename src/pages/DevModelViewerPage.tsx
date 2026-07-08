import { Canvas, useThree } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { useGLTF } from "../three/useGLTF";
import {
  DESIGNER_READY_MODEL_URL,
  UTILITY_READY_MODEL_URL,
} from "../components/three/towerModelUrls";

/**
 * Dev-only GLB workbench (route: /dev/model-viewer, DEV builds only).
 * Drop any .glb onto the page, tweak lighting/material, export a screenshot.
 */

type ViewerSettings = {
  sunIntensity: number;
  ambientIntensity: number;
  envIntensity: number;
  exposure: number;
  roughnessOverride: number; // -1 = leave materials untouched
  wireframe: boolean;
};

const DEFAULTS: ViewerSettings = {
  sunIntensity: 2.4,
  ambientIntensity: 0.35,
  envIntensity: 0.75,
  exposure: 1,
  roughnessOverride: -1,
  wireframe: false,
};

function ViewerModel({
  url,
  settings,
}: {
  url: string;
  settings: ViewerSettings;
}) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  const centered = useMemo(() => {
    const group = new THREE.Group();
    group.add(cloned);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    cloned.position.sub(center);
    cloned.position.y += size.y * 0.5;
    group.scale.setScalar(3.5 / maxDim);
    return group;
  }, [cloned]);

  useEffect(() => {
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const mat of mats) {
        const std = mat as THREE.MeshStandardMaterial;
        std.wireframe = settings.wireframe;
        if (settings.roughnessOverride >= 0 && "roughness" in std) {
          std.roughness = settings.roughnessOverride;
        }
        std.needsUpdate = true;
      }
    });
  }, [cloned, settings.wireframe, settings.roughnessOverride]);

  return <primitive object={centered} />;
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "block", fontSize: 12, marginBottom: 8 }}>
      <span style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        <span>{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </label>
  );
}

export default function DevModelViewerPage() {
  const [modelUrl, setModelUrl] = useState<string>(DESIGNER_READY_MODEL_URL);
  const [droppedName, setDroppedName] = useState<string | null>(null);
  const [settings, setSettings] = useState<ViewerSettings>(DEFAULTS);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const set = useCallback(
    <K extends keyof ViewerSettings>(key: K, value: ViewerSettings[K]) =>
      setSettings((s) => ({ ...s, [key]: value })),
    [],
  );

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith(".glb")) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setDroppedName(file.name);
    setModelUrl(url);
  }, []);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  const exportScreenshot = useCallback(() => {
    const gl = glRef.current;
    if (!gl) return;
    const a = document.createElement("a");
    a.href = gl.domElement.toDataURL("image/png");
    a.download = `model-viewer-${Date.now()}.png`;
    a.click();
  }, []);

  return (
    <main
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={{
        height: "100dvh",
        display: "flex",
        background: "#f5f5f7",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ position: "relative", flex: 1 }}>
        <Canvas
          shadows
          camera={{ position: [6, 2.4, 6], fov: 38 }}
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            toneMapping: THREE.ACESFilmicToneMapping,
          }}
          onCreated={({ gl }) => {
            glRef.current = gl;
          }}
        >
          <color attach="background" args={["#f5f5f7"]} />
          <ExposureBridge exposure={settings.exposure} />
          <ambientLight intensity={settings.ambientIntensity} />
          <directionalLight
            castShadow
            position={[6, 8, 4]}
            intensity={settings.sunIntensity}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <Suspense fallback={null}>
            <Environment
              preset="sunset"
              environmentIntensity={settings.envIntensity}
            />
            <ViewerModel url={modelUrl} settings={settings} />
          </Suspense>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[40, 40]} />
            <shadowMaterial transparent opacity={0.28} />
          </mesh>
          <OrbitControls enableDamping dampingFactor={0.08} />
        </Canvas>
      </div>

      <aside
        style={{
          width: 260,
          padding: 16,
          background: "#ffffff",
          borderLeft: "1px solid #e3e3e8",
          overflowY: "auto",
        }}
      >
        <h1 style={{ fontSize: 14, margin: "0 0 4px" }}>Model viewer (dev)</h1>
        <p style={{ fontSize: 12, color: "#5a6478", margin: "0 0 12px" }}>
          Drop any .glb anywhere on the page.
          {droppedName ? ` Loaded: ${droppedName}` : ""}
        </p>

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <button type="button" onClick={() => setModelUrl(DESIGNER_READY_MODEL_URL)}>
            DSR
          </button>
          <button type="button" onClick={() => setModelUrl(UTILITY_READY_MODEL_URL)}>
            LFM
          </button>
          <button type="button" onClick={exportScreenshot}>
            Export PNG
          </button>
        </div>

        <Slider label="Sun" min={0} max={6} step={0.1}
          value={settings.sunIntensity} onChange={(v) => set("sunIntensity", v)} />
        <Slider label="Ambient" min={0} max={2} step={0.05}
          value={settings.ambientIntensity} onChange={(v) => set("ambientIntensity", v)} />
        <Slider label="Environment" min={0} max={3} step={0.05}
          value={settings.envIntensity} onChange={(v) => set("envIntensity", v)} />
        <Slider label="Exposure" min={0.2} max={2.5} step={0.05}
          value={settings.exposure} onChange={(v) => set("exposure", v)} />
        <Slider label="Roughness override (-1 = off)" min={-1} max={1} step={0.05}
          value={settings.roughnessOverride} onChange={(v) => set("roughnessOverride", v)} />

        <label style={{ fontSize: 12, display: "block", marginTop: 6 }}>
          <input
            type="checkbox"
            checked={settings.wireframe}
            onChange={(e) => set("wireframe", e.target.checked)}
          />{" "}
          Wireframe
        </label>

        <button
          type="button"
          style={{ marginTop: 14 }}
          onClick={() => setSettings(DEFAULTS)}
        >
          Reset
        </button>
      </aside>
    </main>
  );
}

function ExposureBridge({ exposure }: { exposure: number }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
  return null;
}
