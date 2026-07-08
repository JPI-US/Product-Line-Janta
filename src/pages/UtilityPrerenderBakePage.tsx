import { useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { UTILITY_MODEL_URL } from "../components/three/towerModelUrls";
import { PAGE_BG, TOWER_CANVAS_GL } from "../components/three/sceneConfig";
import { UtilitySceneLighting } from "../components/three/UtilitySceneLighting";
import { UtilityStaticCamera } from "../components/three/UtilityStaticCamera";
import { UTILITY_PRERENDER } from "../components/three/utilityPrerenderConfig";
import { UtilityTowerModelBake } from "../components/three/UtilityTowerModelBake";

const { width, height, frameCount } = UTILITY_PRERENDER;

/** Dev-only: real-GPU frames for `npm run bake:utility-prerender` */
export default function UtilityPrerenderBakePage() {
  const params = new URLSearchParams(window.location.search);
  const frameIndex = Math.max(
    0,
    Math.min(frameCount - 1, Number(params.get("frame") ?? 0) || 0)
  );

  useEffect(() => {
    useGLTF.preload(UTILITY_MODEL_URL);
    document.documentElement.dataset.utilityBakeReady = "0";
  }, [frameIndex]);

  return (
    <div
      className="utility-prerender-bake"
      data-bake-root
      style={{
        width,
        height,
        margin: 0,
        background: PAGE_BG,
        overflow: "hidden",
      }}
    >
      <Canvas
        gl={TOWER_CANVAS_GL}
        dpr={1}
        shadows={false}
        camera={{ near: 0.1, far: 200 }}
        style={{ width, height }}
      >
        <color attach="background" args={[PAGE_BG]} />
        <Suspense fallback={null}>
          {/* Fixed sun — only the tower spins (matches live drag; avoids "lighting only" strip) */}
          <UtilitySceneLighting panelYaw={0} />
          <UtilityStaticCamera />
          <UtilityTowerModelBake frameIndex={frameIndex} />
        </Suspense>
      </Canvas>
    </div>
  );
}
