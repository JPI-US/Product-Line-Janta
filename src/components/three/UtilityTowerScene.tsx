import { SCENE } from "./sceneConfig";
import { TowerSceneEnvironment } from "./TowerSceneEnvironment";
import { UtilitySceneLighting } from "./UtilitySceneLighting";
import { UtilityStaticCamera } from "./UtilityStaticCamera";
import { UtilityTowerModel } from "./UtilityTowerModel";
import { UtilityDemandInvalidate } from "./UtilityDemandInvalidate";
import { TowerGpuWarmup } from "./TowerGpuWarmup";
import { TowerCanvasInvalidateBridge } from "./TowerCanvasInvalidateBridge";
import { useTowerScenePrepared } from "./useTowerScenePrepared";
import { TOWER_PREP_KEYS } from "./towerScenePrep";
import { UtilityHiddenWarmup } from "./UtilityHiddenWarmup";

export function UtilityTowerScene() {
  const envIntensity = SCENE.lighting.utility.environmentIntensity;
  const utilityReady = useTowerScenePrepared(TOWER_PREP_KEYS.utility);

  return (
    <>
      <TowerCanvasInvalidateBridge slot="utility" />
      <TowerSceneEnvironment environmentIntensity={envIntensity} />
      <UtilitySceneLighting />
      <UtilityStaticCamera />
      <UtilityTowerModel />
      <UtilityDemandInvalidate />
      <TowerGpuWarmup ready={utilityReady} />
      <UtilityHiddenWarmup />
    </>
  );
}
