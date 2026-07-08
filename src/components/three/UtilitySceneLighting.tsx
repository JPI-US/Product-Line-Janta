import { UTILITY_SCENE } from "./utilitySceneConfig";
import { SUN_TRACK_BLEND_END } from "./sceneScroll";
import { getUtilityVisualYawOffset } from "./sceneScroll";
import { isAnyTowerDragging } from "./towerDragSync";
import { towerScrollOffset } from "./towerScrollOffset";
import { SunLighting } from "./SunLighting";

type UtilitySceneLightingProps = {
  /** Bake route only — live utility tracks drag via getUtilityVisualYawOffset */
  panelYaw?: number;
};

export function UtilitySceneLighting({
  panelYaw,
}: UtilitySceneLightingProps = {}) {
  const { offsetX } = UTILITY_SCENE.tower;

  return (
    <SunLighting
      variant="utility"
      towerX={offsetX}
      getBlend={() => SUN_TRACK_BLEND_END}
      getPanelYawOffset={() =>
        panelYaw ??
        getUtilityVisualYawOffset(isAnyTowerDragging(), towerScrollOffset)
      }
    />
  );
}
