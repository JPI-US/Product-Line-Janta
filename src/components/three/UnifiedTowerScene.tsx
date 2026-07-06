import { Scroll, ScrollControls } from "@react-three/drei";
import { SCENE } from "./sceneConfig";
import { CameraRig } from "./CameraRig";
import { SceneLighting } from "./SceneLighting";
import { ScrollStatsBridge } from "./ScrollStatsBridge";
import { TowerModel } from "./TowerModel";
import { ScrollInvalidate } from "./ScrollInvalidate";
import { TowerSceneEnvironment } from "./TowerSceneEnvironment";
import { TowerScenePreloader } from "./TowerScenePreloader";
import { TowerGpuWarmup } from "./TowerGpuWarmup";
import { UtilitySceneLighting } from "./UtilitySceneLighting";
import { UtilityStaticCamera } from "./UtilityStaticCamera";
import { UtilityTowerModel } from "./UtilityTowerModel";
import { UtilityDemandInvalidate } from "./UtilityDemandInvalidate";
import { TowerUnifiedIdleDriver } from "./TowerUnifiedIdleDriver";
import { UnifiedCanvasInvalidateBridge } from "./UnifiedCanvasInvalidateBridge";
import { useActiveTowerProduct } from "./useActiveTowerProduct";

function DesignerProductScene() {
  return (
    <>
      <SceneLighting />
      <CameraRig />
      <TowerModel />
    </>
  );
}

function UtilityProductScene() {
  return (
    <>
      <UtilitySceneLighting />
      <UtilityStaticCamera />
      <UtilityTowerModel />
      <UtilityDemandInvalidate />
    </>
  );
}

/**
 * Single WebGL scene: scroll + both products; only one active group at a time.
 */
export function UnifiedTowerScene() {
  const active = useActiveTowerProduct();
  const utilityActive = active === "utility";

  return (
    <ScrollControls
      pages={SCENE.scroll.pages}
      damping={0.26}
      distance={1}
      eps={0.001}
    >
      <TowerSceneEnvironment />
      <TowerGpuWarmup />
      <ScrollStatsBridge />
      <ScrollInvalidate />
      <TowerScenePreloader />
      <UnifiedCanvasInvalidateBridge />
      <TowerUnifiedIdleDriver />

      {!utilityActive ? <DesignerProductScene /> : <UtilityProductScene />}

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
