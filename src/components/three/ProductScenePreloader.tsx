import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import type { ProductId } from "../../data/productPages";
import {
  isTowerScenePrepared,
  prepareTowerSceneFromGltf,
} from "./towerScenePrep";
import { getProductTowerLayout, PRODUCT_SCENES } from "./productScene";

export function ProductScenePreloader({ productId }: { productId: ProductId }) {
  const config = PRODUCT_SCENES[productId];
  const { scene } = useGLTF(config.modelUrl);

  useEffect(() => {
    if (!scene || isTowerScenePrepared(config.prepKey)) return;
    const layout = getProductTowerLayout(productId);
    prepareTowerSceneFromGltf(scene, config.prepKey, {
      scale: layout.scale,
      baseClearance: layout.baseClearance,
      skipMeshOptimize: config.skipMeshOptimize,
    });
  }, [scene, config.prepKey, config.skipMeshOptimize, productId]);

  return null;
}
