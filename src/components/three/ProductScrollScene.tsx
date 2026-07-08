import { Scroll, ScrollControls } from "@react-three/drei";
import type { ProductId } from "../../data/productPages";
import { CameraRig } from "./CameraRig";
import { ProductSceneLighting } from "./ProductSceneLighting";
import { ProductScenePreloader } from "./ProductScenePreloader";
import { ProductTowerModel } from "./ProductTowerModel";
import { ScrollInvalidate } from "./ScrollInvalidate";
import { ScrollStatsBridge } from "./ScrollStatsBridge";
import { TowerSceneEnvironment } from "./TowerSceneEnvironment";
import { TowerGpuWarmup } from "./TowerGpuWarmup";
import { TowerCanvasInvalidateBridge } from "./TowerCanvasInvalidateBridge";
import { useTowerScenePrepared } from "./useTowerScenePrepared";
import { getProductIntroScroll, PRODUCT_SCENES } from "./productScene";

export function ProductScrollScene({ productId }: { productId: ProductId }) {
  const prepKey = PRODUCT_SCENES[productId].prepKey;
  const modelReady = useTowerScenePrepared(prepKey);
  const introScroll = getProductIntroScroll(productId);

  return (
    <ScrollControls
      pages={introScroll.pages}
      damping={0.26}
      distance={1}
      eps={0.001}
    >
      <TowerCanvasInvalidateBridge slot="designer" />
      <ScrollStatsBridge />
      <ScrollInvalidate alwaysActive />
      <ProductScenePreloader productId={productId} />
      <TowerSceneEnvironment
        environmentIntensity={PRODUCT_SCENES[productId].environmentIntensity}
        environmentResolution={128}
      />
      <ProductSceneLighting productId={productId} />
      <CameraRig variant={productId} />
      <ProductTowerModel productId={productId} />
      <TowerGpuWarmup ready={modelReady} />

      <Scroll html style={{ width: "100%", pointerEvents: "none" }}>
        <div className="tower-3d__scroll-track">
          <section
            className="tower-3d__scroll-panel tower-3d__scroll-panel--spacer"
            aria-hidden
          />
          <section
            className="tower-3d__scroll-panel tower-3d__scroll-panel--spacer"
            aria-hidden
          />
          <section
            className="tower-3d__scroll-panel tower-3d__scroll-panel--spacer"
            aria-hidden
          />
          <section
            className="tower-3d__scroll-panel tower-3d__scroll-panel--info"
            aria-hidden
          />
          <section
            className="tower-3d__scroll-panel tower-3d__scroll-panel--rotate"
            aria-hidden
          />
          <section
            className="tower-3d__scroll-panel tower-3d__scroll-panel--page"
            aria-hidden
          />
          <section
            className="tower-3d__scroll-panel tower-3d__scroll-panel--page"
            aria-hidden
          />
        </div>
      </Scroll>
    </ScrollControls>
  );
}
