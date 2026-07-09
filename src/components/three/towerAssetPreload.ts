import { useGLTF } from "@react-three/drei";
import type { ProductId } from "../../data/productPages";
import { PRODUCT_SCENES } from "./productScene";
import {
  DESIGNER_MODEL_URL,
  UTILITY_MODEL_URL,
} from "./towerModelUrls";

/** Start fetching tower GLBs (drei cache — same URLs as scenes) */
export function preloadTowerAssets(productId?: ProductId) {
  if (productId) {
    useGLTF.preload(PRODUCT_SCENES[productId].modelUrl);
    return;
  }
  useGLTF.preload(DESIGNER_MODEL_URL);
  useGLTF.preload(UTILITY_MODEL_URL);
}
