import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getWebsiteSkyState } from "./websiteDayCycle";
import { getWebsiteScrollOffset } from "./websiteScrollOffset";

/** Scroll-driven ACES exposure — brighter at golden hour */
export function WebsiteToneMapping() {
  const { gl } = useThree();

  useFrame(() => {
    const sky = getWebsiteSkyState(getWebsiteScrollOffset());
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = sky.exposure;
  });

  return null;
}
