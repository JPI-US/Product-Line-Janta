import type { ProductId } from "../../data/productPages";
import { DESIGNER_TOWER_LAYOUT, SCENE } from "./sceneConfig";
import { DESIGNER_PRODUCT_PERF, UTILITY_PRODUCT_PERF } from "./productTowerPrep";
import { TOWER_PREP_KEYS } from "./towerScenePrep";
import type { MeshOptimizeOptions } from "./towerMeshOptimizer";
import {
  DESIGNER_MODEL_URL,
  UTILITY_MODEL_URL,
} from "./towerModelUrls";

export type ProductSceneConfig = {
  id: ProductId;
  modelUrl: string;
  prepKey: string;
  /** Real-time shadow-map rig (directional light + mesh cast/receive) */
  castShadow: boolean;
  /** Soft radial ground contact shadow under the tower base */
  contactShadow: boolean;
  lightingVariant: "designer" | "utility";
  environmentIntensity: number;
  meshOptimize?: MeshOptimizeOptions;
  skipMeshOptimize?: boolean;
};
export const PRODUCT_SCENES: Record<ProductId, ProductSceneConfig> = {
  designer: {
    id: "designer",
    modelUrl: DESIGNER_MODEL_URL,
    prepKey: TOWER_PREP_KEYS.designer,
    ...DESIGNER_PRODUCT_PERF,
  },
  utility: {
    id: "utility",
    modelUrl: UTILITY_MODEL_URL,
    prepKey: TOWER_PREP_KEYS.utility,
    ...UTILITY_PRODUCT_PERF,
  },
};

/** Shared intro scroll — camera + tower move to center (same on every product page) */
export function getProductIntroScroll(_productId: ProductId) {
  return SCENE.scroll;
}

export const PRODUCT_INTRO_SCROLL = SCENE.scroll;

export function getProductTowerLayout(productId: ProductId) {
  if (productId === "designer" || productId === "utility") {
    return {
      scale: DESIGNER_TOWER_LAYOUT.scale,
      offsetY: DESIGNER_TOWER_LAYOUT.offsetY,
      offsetYEnd: DESIGNER_TOWER_LAYOUT.offsetYEnd,
      offsetX: SCENE.tower.offsetX,
      baseClearance: SCENE.tower.baseClearance,
    };
  }
  return {
    scale: SCENE.tower.scale,
    offsetY: SCENE.tower.offsetY,
    offsetYEnd: SCENE.tower.offsetYEnd,
    offsetX: SCENE.tower.offsetX,
    baseClearance: SCENE.tower.baseClearance,
  };
}
