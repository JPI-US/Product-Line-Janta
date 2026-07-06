import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import { DESIGNER_MODEL_URL } from "../../components/three/towerModelUrls";
import {
  isTowerScenePrepared,
  prepareTowerSceneFromGltf,
} from "../../components/three/towerScenePrep";
import {
  finalizeWebsiteTowerScene,
  getWebsiteTowerPrepConfig,
  WEBSITE_TOWER_PREP_KEY,
} from "./websiteTowerPrep";

/** Prepare DSR designer clone for the marketing canvas */
export function WebsiteTowerPreloader() {
  const { scene } = useGLTF(DESIGNER_MODEL_URL);

  useEffect(() => {
    if (!scene || isTowerScenePrepared(WEBSITE_TOWER_PREP_KEY)) return;
    const prepared = prepareTowerSceneFromGltf(
      scene,
      WEBSITE_TOWER_PREP_KEY,
      getWebsiteTowerPrepConfig()
    );
    finalizeWebsiteTowerScene(prepared.root);
  }, [scene]);

  return null;
}
