import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Link } from "react-router-dom";
import { TowerBelowSection } from "../components/TowerBelowSection";
import {
  PAGE_BG,
  SCENE,
  TOWER_CANVAS_DPR,
  TOWER_CANVAS_GL,
} from "../components/three/sceneConfig";
import { TowerDragSurface } from "../components/three/TowerDragSurface";
import { ScrollStatsOverlay } from "../components/three/ScrollStatsOverlay";
import { TowerPageScroll } from "../components/three/TowerPageScroll";
import { TowerPageScrollCssSync } from "../components/three/TowerPageScrollCssSync";
import { TowerModelPreload } from "../components/three/TowerModelPreload";
import { TowerRotationBackground } from "../components/three/TowerRotationBackground";
import { TowerScrollScene } from "../components/three/TowerScrollScene";
import { TowerCanvasVisibilityProvider } from "../components/three/towerCanvasVisibility";
import { TowerIdlePageDriver } from "../components/three/TowerIdlePageDriver";

function DesignerScrollCanvas({
  start,
  fovStart,
}: {
  start: typeof SCENE.camera.start;
  fovStart: number;
}) {
  return (
    <Canvas
      className="tower-3d__canvas"
      frameloop="demand"
      shadows={false}
      camera={{
        position: [start.x, start.y, start.z],
        fov: fovStart,
        near: 0.1,
        far: 200,
      }}
      gl={TOWER_CANVAS_GL}
      dpr={TOWER_CANVAS_DPR}
    >
      <color attach="background" args={[PAGE_BG]} />
      <Suspense
        fallback={
          <mesh>
            <boxGeometry args={[0.01, 0.01, 0.01]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        }
      >
        <TowerScrollScene />
      </Suspense>
    </Canvas>
  );
}

/** Original layout: separate WebGL context per tower */
export default function Tower3DPageLegacy() {
  const { start, fovStart } = SCENE.camera;

  return (
    <TowerCanvasVisibilityProvider>
      <TowerPageScrollCssSync />
      <TowerIdlePageDriver />
      <TowerModelPreload />
      <TowerRotationBackground />
      <div className="tower-3d-page">
        <div className="tower-3d-page__top">
          <Link to="/" className="tower-3d-page__back">
            Product line
          </Link>
          <p className="tower-3d-page__badge">3D preview</p>
        </div>

        <TowerPageScroll />

        <div className="tower-3d__experience">
          <header
            className="tower-3d__hero-fixed"
            aria-label="Product line hero"
          >
            <p className="tower-3d__hero-eyebrow">Janta Power</p>
            <h1 className="tower-3d__hero-title">Product Line</h1>
            <p className="tower-3d__hero-hint">Scroll to learn more.</p>
          </header>

          <TowerDragSurface />

          <div className="tower-3d__viewport">
            <DesignerScrollCanvas start={start} fovStart={fovStart} />
          </div>

          <aside
            className="tower-3d__split-pane"
            aria-label="Product information"
          >
            <ScrollStatsOverlay />
          </aside>
        </div>

        <section className="tower-3d__page-below" aria-label="More product line">
          <TowerBelowSection />
        </section>
      </div>
    </TowerCanvasVisibilityProvider>
  );
}
