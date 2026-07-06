import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { ProductId } from "../data/productPages";
import { getProductPage } from "../data/productPages";
import { DesignerHeroOverlays } from "./DesignerHeroOverlays";
import { DesignerPanelsBelow } from "./DesignerPanelsBelow";
import { ProductScrollStatsOverlay } from "./ProductScrollStatsOverlay";
import { UtilityProductBelow } from "./UtilityProductBelow";
import {
  PAGE_BG,
  SCENE,
  PRODUCT_CANVAS_GL,
  TOWER_CANVAS_DPR,
} from "./three/sceneConfig";
import { PRODUCT_SCENES } from "./three/productScene";
import { ProductScrollScene } from "./three/ProductScrollScene";
import { ProductModelPreload } from "./three/ProductModelPreload";
import { TowerDragSurface } from "./three/TowerDragSurface";
import { TowerIdlePageDriver } from "./three/TowerIdlePageDriver";
import { TowerPageScroll } from "./three/TowerPageScroll";
import { TowerPageScrollCssSync } from "./three/TowerPageScrollCssSync";
import { TowerRotationBackground } from "./three/TowerRotationBackground";

type ProductTowerPageProps = {
  productId: ProductId;
};

function ProductScrollCanvas({
  productId,
  castShadow,
}: {
  productId: ProductId;
  castShadow: boolean;
}) {
  const { start, fovStart } = SCENE.camera;
  const softPanelBg = productId === "designer";

  return (
    <Canvas
      className="tower-3d__canvas"
      frameloop="demand"
      shadows={castShadow}
      camera={{
        position: [start.x, start.y, start.z],
        fov: fovStart,
        near: 0.1,
        far: 200,
      }}
      gl={{
        ...PRODUCT_CANVAS_GL,
        alpha: softPanelBg,
      }}
      dpr={TOWER_CANVAS_DPR}
      onCreated={({ gl }) => {
        if (softPanelBg) gl.setClearColor(0x000000, 0);
      }}
    >
      {!softPanelBg ? <color attach="background" args={[PAGE_BG]} /> : null}
      <Suspense
        fallback={
          <mesh>
            <boxGeometry args={[0.01, 0.01, 0.01]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        }
      >
        <ProductScrollScene productId={productId} />
      </Suspense>
    </Canvas>
  );
}

/** Single product — shared scroll intro, then product-specific content below */
export function ProductTowerPage({ productId }: ProductTowerPageProps) {
  const page = getProductPage(productId);
  const scene = PRODUCT_SCENES[productId];

  return (
    <>
      <TowerPageScrollCssSync />
      <TowerIdlePageDriver singleCanvas />
      <ProductModelPreload productId={productId} />
      <TowerRotationBackground />
      <div
        className={
          productId === "designer"
            ? "tower-3d-page tower-3d-page--designer"
            : "tower-3d-page"
        }
      >
        <TowerPageScroll />

        <div
          className={`tower-3d__experience${
            productId === "designer" ? " tower-3d__soft-panel-bg" : ""
          }`}
        >
          {productId === "designer" ? (
            <>
              <DesignerHeroOverlays />
              <TowerDragSurface />
              <div className="tower-3d__viewport">
                <ProductScrollCanvas
                  productId={productId}
                  castShadow={scene.castShadow}
                />
              </div>
            </>
          ) : (
            <>
              <header
                className="tower-3d__hero-fixed"
                aria-label={`${page.tower.title} hero`}
              >
                <p className="tower-3d__hero-eyebrow">Janta Power</p>
                <h1 className="tower-3d__hero-title">{page.tower.title}</h1>
                <p className="tower-3d__hero-hint">Scroll to learn more.</p>
              </header>

              <TowerDragSurface />

              <div className="tower-3d__viewport">
                <ProductScrollCanvas
                  productId={productId}
                  castShadow={scene.castShadow}
                />
              </div>

              <aside
                className="tower-3d__split-pane"
                aria-label={`${page.tower.title} product information`}
              >
                <ProductScrollStatsOverlay productId={productId} />
              </aside>
            </>
          )}
        </div>

        <section
          className={`tower-3d__page-below${
            productId === "designer" ? " tower-3d__soft-panel-bg" : ""
          }`}
          aria-label={`More about ${page.tower.title}`}
        >
          {page.belowVariant === "panels" ? (
            <DesignerPanelsBelow />
          ) : (
            <UtilityProductBelow />
          )}
        </section>
      </div>
    </>
  );
}
