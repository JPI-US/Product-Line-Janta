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
import { TowerCanvasInvalidateBridge } from "./TowerCanvasInvalidateBridge";
import { useTowerCanvasVisibility } from "./towerCanvasVisibility";
import { useTowerScenePrepared } from "./useTowerScenePrepared";
import { TOWER_PREP_KEYS } from "./towerScenePrep";

function DesignerScene3d() {
  const { renderDesigner3d } = useTowerCanvasVisibility();
  const designerReady = useTowerScenePrepared(TOWER_PREP_KEYS.designer);

  return (
    <group visible={renderDesigner3d}>
      <TowerSceneEnvironment />
      <SceneLighting />
      <CameraRig />
      <TowerModel />
      <TowerGpuWarmup ready={designerReady} />
    </group>
  );
}

export function TowerScrollScene() {
  return (
    <ScrollControls
      pages={SCENE.scroll.pages}
      damping={0.26}
      distance={1}
      eps={0.001}
    >
      <TowerCanvasInvalidateBridge slot="designer" />
      <ScrollStatsBridge />
      <ScrollInvalidate />
      <TowerScenePreloader />
      <DesignerScene3d />

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
