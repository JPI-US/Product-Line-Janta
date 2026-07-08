import { PAGE_BG, SCENE } from "./sceneConfig";
import { PRODUCT_TOWER_PREP } from "./productTowerPrep";
import { UTILITY_MODEL_URL } from "./towerModelUrls";

/** Static split-view presentation for the Utility Tower section */
export const UTILITY_SCENE = {
  modelUrl: UTILITY_MODEL_URL,
  lookAtEnd: { x: 0, y: SCENE.lookAtEnd.y, z: 0 },
  tower: {
    offsetX: SCENE.tower.offsetX,
    offsetY: SCENE.tower.offsetYEnd,
    scale: SCENE.tower.scale,
    yawOffset: SCENE.tower.yawOffset,
    baseClearance: SCENE.tower.baseClearance,
  },
  floor: { y: SCENE.floor.y, size: SCENE.floor.size },
  sun: SCENE.sun,
  prep: PRODUCT_TOWER_PREP,
} as const;

export { PAGE_BG };
