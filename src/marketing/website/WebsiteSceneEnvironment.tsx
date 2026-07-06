import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TowerSceneEnvironment } from "../../components/three/TowerSceneEnvironment";
import { getWebsiteSkyState } from "./websiteDayCycle";
import { getWebsiteScrollOffset } from "./websiteScrollOffset";

/** HDRI reflections with scroll-driven intensity */
export function WebsiteSceneEnvironment() {
  const { scene } = useThree();

  useFrame(() => {
    const sky = getWebsiteSkyState(getWebsiteScrollOffset());
    if ("environmentIntensity" in scene) {
      (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity =
        sky.envIntensity;
    }
  });

  return <TowerSceneEnvironment environmentIntensity={0.42} environmentResolution={128} />;
}
