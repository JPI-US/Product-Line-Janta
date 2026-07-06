import { useScroll } from "@react-three/drei";
import { SCENE } from "./sceneConfig";
import { getScrollBlend, getTowerVisualYawOffset } from "./sceneScroll";
import { isAnyTowerDragging } from "./towerDragSync";
import { SunLighting } from "./SunLighting";

export function SceneLighting() {
  const scroll = useScroll();

  return (
    <SunLighting
      variant="designer"
      towerX={SCENE.tower.offsetX}
      getBlend={() => getScrollBlend(scroll.offset)}
      getPanelYawOffset={() =>
        getTowerVisualYawOffset(scroll.offset, isAnyTowerDragging())
      }
    />
  );
}
