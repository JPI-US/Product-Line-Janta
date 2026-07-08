import { Suspense } from "react";
import { Link } from "react-router-dom";
import { TowerBelowSection } from "../components/TowerBelowSection";
import { TowerDragSurface } from "../components/three/TowerDragSurface";
import { ScrollStatsOverlay } from "../components/three/ScrollStatsOverlay";
import { TowerPageScroll } from "../components/three/TowerPageScroll";
import { TowerModelPreload } from "../components/three/TowerModelPreload";
import { TowerRotationBackground } from "../components/three/TowerRotationBackground";
import { UnifiedTowerCanvas } from "../components/three/UnifiedTowerCanvas";
import { useActiveTowerProduct } from "../components/three/useActiveTowerProduct";

/** Single WebGL canvas behind transparent designer + utility viewports */
export default function Tower3DPageUnified() {
  const utilityActive = useActiveTowerProduct() === "utility";

  return (
    <>
      <TowerModelPreload />
      <TowerRotationBackground />
      <div className="tower-3d-page tower-3d-page--unified">
        <div className="tower-3d-page__top">
          <Link to="/" className="tower-3d-page__back">
            Product line
          </Link>
          <p className="tower-3d-page__badge">3D preview</p>
        </div>

        <TowerPageScroll />

        <div
          className="tower-3d__unified-canvas-host"
          aria-hidden={utilityActive}
        >
          <Suspense fallback={null}>
            <UnifiedTowerCanvas />
          </Suspense>
        </div>

        <div className="tower-3d__experience">
          <header
            className="tower-3d__hero-fixed"
            aria-label="Product line hero"
          >
            <p className="tower-3d__hero-eyebrow">Janta Power</p>
            <h1 className="tower-3d__hero-title">Product Line</h1>
            <p className="tower-3d__hero-hint">Scroll to learn more.</p>
          </header>

          {!utilityActive && <TowerDragSurface />}

          <div
            className="tower-3d__viewport tower-3d__viewport--unified"
            aria-hidden={utilityActive}
          />

          <aside
            className="tower-3d__split-pane"
            aria-label="Product information"
          >
            <ScrollStatsOverlay />
          </aside>
        </div>

        <section className="tower-3d__page-below" aria-label="More product line">
          <TowerBelowSection unifiedCanvas />
        </section>
      </div>
    </>
  );
}
