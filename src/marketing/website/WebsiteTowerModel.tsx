import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { DESIGNER_MODEL_URL } from "../../components/three/towerModelUrls";
import { getCachedTowerScene } from "../../components/three/towerScenePrep";
import { useTowerScenePrepared } from "../../components/three/useTowerScenePrepared";
import { getWebsiteTowerYaw } from "./websiteSceneScroll";
import { WEBSITE_SCENE } from "./websiteSceneConfig";
import { getWebsiteScrollOffset } from "./websiteScrollOffset";
import {
  applyWebsiteMarketingMaterials,
  WEBSITE_TOWER_PREP_KEY,
} from "./websiteTowerPrep";

export function WebsiteTowerModel() {
  const groupRef = useRef<THREE.Group>(null);
  const cloneRef = useRef<THREE.Object3D | null>(null);
  useGLTF(DESIGNER_MODEL_URL);

  const ready = useTowerScenePrepared(WEBSITE_TOWER_PREP_KEY);
  const prepared = ready ? getCachedTowerScene(WEBSITE_TOWER_PREP_KEY) : null;

  useLayoutEffect(() => {
    if (!prepared || !groupRef.current) return;
    const group = groupRef.current;
    if (cloneRef.current) {
      group.remove(cloneRef.current);
      cloneRef.current = null;
    }
    const clone = prepared.root.clone(true);
    cloneRef.current = clone;
    applyWebsiteMarketingMaterials(clone);
    group.add(clone);
  }, [prepared]);

  useFrame(() => {
    if (!prepared || !groupRef.current) return;
    const { baseLift } = prepared;

    groupRef.current.position.set(
      WEBSITE_SCENE.tower.offsetX,
      baseLift + WEBSITE_SCENE.tower.offsetY,
      0
    );
    groupRef.current.rotation.y = getWebsiteTowerYaw(getWebsiteScrollOffset());
  });

  if (!prepared) return null;

  return <group ref={groupRef} />;
}
