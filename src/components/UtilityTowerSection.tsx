import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { UtilityTowerPrerender } from "./UtilityTowerPrerender";
import { USE_UTILITY_PRERENDER } from "./three/towerCanvasMode";
import { useTowerCanvasVisibility } from "./three/towerCanvasVisibility";
import { UtilityDragSurface } from "./three/UtilityDragSurface";
import { UtilityTowerInfo } from "./three/UtilityTowerInfo";
import { UtilityTowerScene } from "./three/UtilityTowerScene";
import {
  getSplitViewCamera,
  TOWER_CANVAS_DPR,
  TOWER_CANVAS_GL,
} from "./three/sceneConfig";
import { PAGE_BG, UTILITY_SCENE } from "./three/utilitySceneConfig";

type UtilityTowerSectionProps = {
  unifiedCanvas?: boolean;
};

export function UtilityTowerSection({
  unifiedCanvas = false,
}: UtilityTowerSectionProps) {
  if (unifiedCanvas) {
    return <UtilityTowerSectionUnified />;
  }
  if (USE_UTILITY_PRERENDER) {
    return <UtilityTowerSectionPrerender />;
  }
  return <UtilityTowerSectionDual />;
}

function UtilityTowerSectionUnified() {
  return (
    <section
      className="tower-3d__utility-section tower-3d__utility-section--unified"
      aria-label="LFM Tower"
    >
      <UtilityDragSurface />

      <div
        className="tower-3d__utility-viewport tower-3d__utility-viewport--unified"
        aria-hidden
      />

      <aside
        className="tower-3d__utility-split"
        aria-label="LFM Tower product information"
      >
        <UtilityTowerInfo />
      </aside>
    </section>
  );
}

function UtilityTowerSectionPrerender() {
  return (
    <section
      className="tower-3d__utility-section tower-3d__utility-section--prerender"
      aria-label="LFM Tower"
    >
      <UtilityDragSurface />

      <div className="tower-3d__utility-viewport tower-3d__utility-viewport--prerender">
        <UtilityTowerPrerender />
      </div>

      <aside
        className="tower-3d__utility-split"
        aria-label="LFM Tower product information"
      >
        <UtilityTowerInfo />
      </aside>
    </section>
  );
}

function UtilityTowerSectionDual() {
  const { position, fov } = getSplitViewCamera(UTILITY_SCENE.tower.offsetX);
  const { renderUtility3d, mountUtilityCanvas } = useTowerCanvasVisibility();
  const drawing = renderUtility3d;

  return (
    <section className="tower-3d__utility-section" aria-label="LFM Tower">
      <UtilityDragSurface />

      <div
        className={
          drawing
            ? "tower-3d__utility-viewport"
            : "tower-3d__utility-viewport tower-3d__utility-viewport--warmup"
        }
      >
        {mountUtilityCanvas ? (
          <Canvas
            className="tower-3d__utility-canvas"
            frameloop={drawing ? "demand" : "never"}
            shadows={false}
            camera={{
              position,
              fov,
              near: 0.1,
              far: 200,
            }}
            gl={TOWER_CANVAS_GL}
            dpr={TOWER_CANVAS_DPR}
          >
            <color attach="background" args={[PAGE_BG]} />
            <Suspense fallback={null}>
              <UtilityTowerScene />
            </Suspense>
          </Canvas>
        ) : (
          <div
            className="tower-3d__canvas-placeholder"
            style={{ background: PAGE_BG }}
            aria-hidden
          />
        )}
      </div>

      <aside
        className="tower-3d__utility-split"
        aria-label="LFM Tower product information"
      >
        <UtilityTowerInfo />
      </aside>
    </section>
  );
}
