import type { ProductId } from "../../data/productPages";
import { SCENE } from "./sceneConfig";
import { PRODUCT_TOWER_PERF } from "./productTowerPrep";
import { TOWER_PREP_KEYS } from "./towerScenePrep";
import {
  DESIGNER_MODEL_URL,
  UTILITY_MODEL_URL,
} from "./towerModelUrls";

export type ProductSceneConfig = {
  id: ProductId;
  modelUrl: string;
  prepKey: string;
  castShadow: boolean;
  lightingVariant: "designer" | "utility";
  environmentIntensity: number;
  meshOptimize?: (typeof SCENE.tower.prep)["meshOptimize"];
  skipMeshOptimize?: boolean;
};

export const PRODUCT_SCENES: Record<ProductId, ProductSceneConfig> = {
  designer: {
    id: "designer",
    modelUrl: DESIGNER_MODEL_URL,
    prepKey: TOWER_PREP_KEYS.designer,
    ...PRODUCT_TOWER_PERF,
  },
  utility: {
    id: "utility",
    modelUrl: UTILITY_MODEL_URL,
    prepKey: TOWER_PREP_KEYS.utility,
    ...PRODUCT_TOWER_PERF,
  },
};

/** Shared intro scroll — camera + tower move to center (same on every product page) */
export function getProductIntroScroll(_productId: ProductId) {
  return SCENE.scroll;
}

export const PRODUCT_INTRO_SCROLL = SCENE.scroll;
