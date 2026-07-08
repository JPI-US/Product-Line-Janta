import { useGLTF } from "../../three/useGLTF";
import { useEffect } from "react";
import type { ProductId } from "../../data/productPages";
import { SCENE } from "./sceneConfig";
import {
  isTowerScenePrepared,
  prepareTowerSceneFromGltf,
} from "./towerScenePrep";
import { PRODUCT_SCENES } from "./productScene";

export function ProductScenePreloader({ productId }: { productId: ProductId }) {
  const config = PRODUCT_SCENES[productId];
  const { scene } = useGLTF(config.modelUrl);

  useEffect(() => {
    if (!scene || isTowerScenePrepared(config.prepKey)) return;
    prepareTowerSceneFromGltf(scene, config.prepKey, {
      scale: SCENE.tower.scale,
      baseClearance: SCENE.tower.baseClearance,
      skipMeshOptimize: config.skipMeshOptimize,
    });
  }, [scene, config.prepKey, config.skipMeshOptimize]);

  return null;
}
