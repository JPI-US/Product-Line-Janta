import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { ProductId } from "../data/productPages";
import { getProductPage } from "../data/productPages";
import { DesignerPanelsBelow } from "./DesignerPanelsBelow";
import { ProductHeroOverlays } from "./ProductHeroOverlays";
import { ProductScrollHint } from "./ProductScrollHint";
import { UtilityPanelsBelow } from "./UtilityPanelsBelow";
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
import { WebGLCanvasBoundary } from "./WebGLCanvasBoundary";
import { supportsWebGL } from "../lib/webglSupport";
import { isProductHeroLayout } from "../lib/productHeroScroll";

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
  const softPanelBg = isProductHeroLayout(productId);

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

function productPageClass(productId: ProductId) {
  if (productId === "designer") {
    return "tower-3d-page tower-3d-page--designer";
  }
  return "tower-3d-page tower-3d-page--designer tower-3d-page--utility";
}

/** Single product — shared scroll intro, then product-specific content below */
export function ProductTowerPage({ productId }: ProductTowerPageProps) {
  const page = getProductPage(productId);
  const scene = PRODUCT_SCENES[productId];
  const webgl = supportsWebGL();
  const productHero = isProductHeroLayout(productId);

  return (
    <>
      <TowerPageScrollCssSync />
      <TowerIdlePageDriver singleCanvas />
      <ProductModelPreload productId={productId} />
      <TowerRotationBackground />
      <div className={productPageClass(productId)}>
        <TowerPageScroll />

        <div
          className={`tower-3d__experience${
            productHero ? " tower-3d__soft-panel-bg" : ""
          }`}
        >
          {productHero ? <ProductHeroOverlays productId={productId} /> : null}

          {webgl ? (
            <>
              <TowerDragSurface productId={productId} />
              <div className="tower-3d__viewport">
                <WebGLCanvasBoundary label="product-tower">
                  <ProductScrollCanvas
                    productId={productId}
                    castShadow={scene.castShadow}
                  />
                </WebGLCanvasBoundary>
              </div>
            </>
          ) : null}

          <ProductScrollHint />
        </div>

        <section
          className="tower-3d__page-below"
          aria-label={`More about ${page.tower.title}`}
        >
          {productId === "designer" ? (
            <DesignerPanelsBelow />
          ) : (
            <UtilityPanelsBelow />
          )}
        </section>
      </div>
    </>
  );
}
