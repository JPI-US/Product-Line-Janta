import { useScroll } from "@react-three/drei";
import type { ProductId } from "../../data/productPages";
import { SCENE } from "./sceneConfig";
import { getScrollBlend, getTowerVisualYawOffset } from "./sceneScroll";
import { isAnyTowerDragging } from "./towerDragSync";
import { isProductHero3dActive } from "./productScrollPerf";
import { SunLighting } from "./SunLighting";
import { PRODUCT_SCENES } from "./productScene";

export function ProductSceneLighting({ productId }: { productId: ProductId }) {
  const scroll = useScroll();
  const { lightingVariant } = PRODUCT_SCENES[productId];

  return (
    <SunLighting
      variant={lightingVariant}
      towerX={SCENE.tower.offsetX}
      showSunSphere={productId !== "designer"}
      isActive={() => isProductHero3dActive(scroll.offset)}
      getBlend={() => getScrollBlend(scroll.offset)}
      getPanelYawOffset={() =>
        getTowerVisualYawOffset(scroll.offset, isAnyTowerDragging())
      }
    />
  );
}
