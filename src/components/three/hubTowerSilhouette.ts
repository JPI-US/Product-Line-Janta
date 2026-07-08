import * as THREE from "three";
import { meshUsesPvPanelMaterial } from "./towerMaterials";
import {
  createHubTowerMaterials,
  updateHubTowerMaterials,
  type HubTowerEnvironment,
} from "./hubTowerEnvironment";

export type HubTowerMaterialSet = ReturnType<typeof createHubTowerMaterials>;

export function applyHubTowerMaterials(
  root: THREE.Object3D,
  materials: HubTowerMaterialSet,
  options?: { castShadow?: boolean; receiveShadow?: boolean }
): void {
  const castShadow = options?.castShadow ?? false;
  const receiveShadow = options?.receiveShadow ?? false;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    mesh.material = meshUsesPvPanelMaterial(mesh)
      ? materials.panel
      : materials.frame;
  });
}

export function syncHubTowerMaterials(
  materials: HubTowerMaterialSet,
  env: HubTowerEnvironment,
  materialLerp?: number
): void {
  updateHubTowerMaterials(materials, env, materialLerp);
}
