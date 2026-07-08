import { useGLTF } from "../../three/useGLTF";
import { useEffect, useMemo, useState } from "react";
import { UTILITY_MODEL_URL } from "./towerModelUrls";
import {
  applySplitViewYawOffset,
  getSplitViewBaseYaw,
  SUN_TRACK_BLEND_END,
} from "./sceneScroll";
import {
  isTowerScenePrepared,
  prepareTowerSceneFromGltf,
  TOWER_PREP_KEYS,
  getCachedTowerScene,
} from "./towerScenePrep";
import { TOWER_YAW_HALF_RANGE } from "./towerSharedRotation";
import { getUtilityPrerenderYawForFrame } from "./utilityPrerenderConfig";
import { UTILITY_SCENE } from "./utilitySceneConfig";

/** Loads + poses utility mesh for the browser bake route */
export function UtilityTowerModelBake({ frameIndex }: { frameIndex: number }) {
  const { scene } = useGLTF(UTILITY_MODEL_URL);
  const [preparedKey, setPreparedKey] = useState(0);

  const yawOffset = useMemo(
    () => getUtilityPrerenderYawForFrame(frameIndex),
    [frameIndex]
  );

  useEffect(() => {
    if (!scene) return;
    if (!isTowerScenePrepared(TOWER_PREP_KEYS.utility)) {
      prepareTowerSceneFromGltf(scene, TOWER_PREP_KEYS.utility, {
        scale: UTILITY_SCENE.tower.scale,
        baseClearance: UTILITY_SCENE.tower.baseClearance,
        skipMeshOptimize: true,
      });
    }
    setPreparedKey((k) => k + 1);
  }, [scene]);

  const prepared =
    preparedKey > 0 ? getCachedTowerScene(TOWER_PREP_KEYS.utility) : null;

  useEffect(() => {
    if (!prepared) return;
    const { offsetX, offsetY, yawOffset: towerYaw } = UTILITY_SCENE.tower;
    prepared.root.position.set(offsetX, prepared.baseLift + offsetY, 0);
    const splitBaseYaw = getSplitViewBaseYaw(
      SUN_TRACK_BLEND_END,
      offsetX,
      towerYaw
    );
    prepared.root.rotation.y = applySplitViewYawOffset(
      splitBaseYaw,
      yawOffset,
      TOWER_YAW_HALF_RANGE
    );
    prepared.root.updateMatrixWorld(true);
    document.documentElement.dataset.utilityBakeReady = "1";
  }, [prepared, yawOffset, preparedKey]);

  if (!prepared) return null;

  return <primitive object={prepared.root} dispose={null} />;
}
