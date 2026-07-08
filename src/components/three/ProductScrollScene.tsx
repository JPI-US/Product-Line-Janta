import { Scroll, ScrollControls, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
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
import { SCENE } from "./sceneConfig";
import { TowerContactShadow } from "./TowerContactShadow";
import { getScrollBlend } from "./sceneScroll";
import { getCachedTowerScene } from "./towerScenePrep";

function ProductTowerContactShadow({ productId }: { productId: ProductId }) {
  const scroll = useScroll();
  const groupRef = useRef<THREE.Group>(null);
  const prepKey = PRODUCT_SCENES[productId].prepKey;
  const prepared = getCachedTowerScene(prepKey);
  const baseLift = prepared?.baseLift ?? 0;

  useFrame(() => {
    if (!groupRef.current) return;
    const blend = getScrollBlend(scroll.offset);
    const offsetY = THREE.MathUtils.lerp(
      SCENE.tower.offsetY,
      SCENE.tower.offsetYEnd,
      blend
    );
    groupRef.current.position.set(
      SCENE.tower.offsetX,
      baseLift + offsetY + SCENE.tower.baseClearance,
      0
    );
  });

  return (
    <group ref={groupRef}>
      <TowerContactShadow
        position={[0, 0, 0]}
        getOpacityBlend={() => getScrollBlend(scroll.offset)}
      />
    </group>
  );
}

export function ProductScrollScene({ productId }: { productId: ProductId }) {
  const prepKey = PRODUCT_SCENES[productId].prepKey;
  const sceneConfig = PRODUCT_SCENES[productId];
  const modelReady = useTowerScenePrepared(prepKey);
  const introScroll = getProductIntroScroll(productId);

  return (
    <ScrollControls
      pages={introScroll.pages}
      damping={0.26}
      distance={1}
      eps={0.001}
    >
      <TowerCanvasInvalidateBridge slot={productId} />
      <ScrollStatsBridge />
      <ScrollInvalidate alwaysActive />
      <ProductScenePreloader productId={productId} />
      <TowerSceneEnvironment
        environmentIntensity={sceneConfig.environmentIntensity}
        environmentResolution={128}
      />
      <ProductSceneLighting productId={productId} />
      <CameraRig variant={productId} />
      <ProductTowerModel productId={productId} />
      <TowerGpuWarmup ready={modelReady} />
      {sceneConfig.contactShadow ? (
        <ProductTowerContactShadow productId={productId} />
      ) : null}

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
