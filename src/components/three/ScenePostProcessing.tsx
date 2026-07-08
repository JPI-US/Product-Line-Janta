import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";
import * as THREE from "three";

/** Post-FX is skipped entirely on coarse-pointer (mobile) devices. */
const isCoarsePointer = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;

/**
 * Cinematic post-processing for the product hero + orbit canvases.
 * Subtle by design: shallow depth of field focused at the tower, a low
 * bloom for glass speculars, and a faint vignette + chromatic aberration.
 *
 * Mobile gate: never mounts on coarse pointers, and the host scene can also
 * disable it at runtime (e.g. from a PerformanceMonitor decline) via
 * `enabled={false}`.
 */
export function ScenePostProcessing({
  enabled = true,
  // World units — towers sit ~9–15 units from the camera in every scene.
  worldFocusDistance = 12,
  worldFocusRange = 18,
  bokehScale = 2,
}: {
  enabled?: boolean;
  worldFocusDistance?: number;
  worldFocusRange?: number;
  bokehScale?: number;
}) {
  const gl = useThree((s) => s.gl);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    // `?postfx=1` forces the gate open for visual QA in headless browsers.
    const forced = new URLSearchParams(window.location.search).has("postfx");
    if (!forced) {
      if (isCoarsePointer()) return;
      // Skip post-FX when the context is already struggling (software GL etc.)
      const debugInfo = gl
        .getContext()
        .getExtension("WEBGL_debug_renderer_info");
      const renderer = debugInfo
        ? String(
            gl.getContext().getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
          ).toLowerCase()
        : "";
      if (renderer.includes("swiftshader") || renderer.includes("llvmpipe")) {
        return;
      }
    }
    setGateOpen(true);
  }, [gl]);

  if (!enabled || !gateOpen) return null;

  return (
    <EffectComposer multisampling={0}>
      <DepthOfField
        worldFocusDistance={worldFocusDistance}
        worldFocusRange={worldFocusRange}
        bokehScale={bokehScale}
      />
      <Bloom
        luminanceThreshold={0.9}
        luminanceSmoothing={0.2}
        intensity={0.35}
        mipmapBlur
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.00015, 0.00015)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.42} />
    </EffectComposer>
  );
}
