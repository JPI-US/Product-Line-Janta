import * as THREE from "three";
import { syncSceneEnvironmentMaps } from "./towerMaterials";

let sharedEnvironmentMap: THREE.Texture | null = null;

export function getSharedEnvironmentMap(): THREE.Texture | null {
  return sharedEnvironmentMap;
}

export function captureSharedEnvironmentMap(env: THREE.Texture) {
  if (sharedEnvironmentMap) return;
  if ("mapping" in env) {
    env.mapping = THREE.EquirectangularReflectionMapping;
  }
  env.colorSpace = THREE.SRGBColorSpace;
  sharedEnvironmentMap = env;
  syncSceneEnvironmentMaps(env);
}

/** Apply cached HDRI to a canvas scene (skips re-download on remount) */
export function applySharedEnvironmentToScene(scene: THREE.Scene) {
  if (!sharedEnvironmentMap) return false;
  scene.environment = sharedEnvironmentMap;
  syncSceneEnvironmentMaps(sharedEnvironmentMap);
  return true;
}
