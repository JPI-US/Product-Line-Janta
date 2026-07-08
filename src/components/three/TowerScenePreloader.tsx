import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import { DESIGNER_MODEL_URL } from "./towerModelUrls";
import {
  getDesignerTowerPrepConfig,
  isTowerScenePrepared,
  prepareTowerSceneFromGltf,
  TOWER_PREP_KEYS,
} from "./towerScenePrep";

/**
 * Prepare designer scene as soon as GLB is parsed so first scroll is not blocked by idle-time mesh merge.
 */
export function TowerScenePreloader() {
  const { scene: designerGltf } = useGLTF(DESIGNER_MODEL_URL);

  useEffect(() => {
    if (!designerGltf || isTowerScenePrepared(TOWER_PREP_KEYS.designer)) return;
    prepareTowerSceneFromGltf(
      designerGltf,
      TOWER_PREP_KEYS.designer,
      getDesignerTowerPrepConfig()
    );
  }, [designerGltf]);

  return null;
}
