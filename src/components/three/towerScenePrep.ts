import * as THREE from "three";
import { SCENE } from "./sceneConfig";
import { optimizeTowerMeshes } from "./towerMaterials";
import type { MeshOptimizeOptions } from "./towerMeshOptimizer";
import { countObjectTriangles } from "./towerGeometryStats";

export type TowerPrepConfig = {
  scale: number;
  baseClearance: number;
  meshOptimize?: MeshOptimizeOptions;
  /** Set when loading TR-08-001-ready.glb (merge baked at build time) */
  skipMeshOptimize?: boolean;
};

export type PreparedTowerScene = {
  root: THREE.Object3D;
  baseLift: number;
};

export const TOWER_PREP_KEYS = {
  /** v2 — skip runtime merge on *-ready.glb (hub was double-optimizing v1 cache) */
  designer: "designer-ready-glb-v2",
  utility: "utility-ready-glb-v1",
} as const;

/** Cache key for the low-res `-lod2` stand-in prepared before the full GLB. */
export function getLodPrepKey(prepKey: string): string {
  return `${prepKey}--lod2`;
}

/** Bbox fit only — mesh merge is baked offline into *-ready.glb */
export function getDesignerTowerPrepConfig(): TowerPrepConfig {
  return {
    scale: SCENE.tower.scale,
    baseClearance: SCENE.tower.baseClearance,
    skipMeshOptimize: true,
  };
}

const sceneCache = new Map<string, PreparedTowerScene>();
const prepListeners = new Set<() => void>();

function notifyTowerScenePrepared() {
  prepListeners.forEach((listener) => listener());
}

export function subscribeTowerScenePrep(listener: () => void) {
  prepListeners.add(listener);
  return () => {
    prepListeners.delete(listener);
  };
}

function stripExportHelpers(root: THREE.Object3D) {
  const toRemove: THREE.Object3D[] = [];
  root.traverse((obj) => {
    if ((obj as THREE.Camera).isCamera || (obj as THREE.Light).isLight) {
      toRemove.push(obj);
    }
  });
  toRemove.forEach((obj) => obj.parent?.remove(obj));
}

/** One-time fit + mesh merge; cached for instant remounts */
export function prepareTowerSceneFromGltf(
  gltfScene: THREE.Object3D,
  cacheKey: string,
  config: TowerPrepConfig
): PreparedTowerScene {
  const existing = sceneCache.get(cacheKey);
  if (existing) return existing;

  const root = gltfScene.clone(true);
  stripExportHelpers(root);

  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(...box.getSize(new THREE.Vector3()).toArray());
  const scale = config.scale / maxDim;

  root.position.copy(center).multiplyScalar(-scale);
  root.scale.setScalar(scale);
  root.rotation.set(0, 0, 0);

  const alreadyMerged = root.getObjectByName("tower-merged") != null;
  if (!config.skipMeshOptimize && !alreadyMerged) {
    try {
      optimizeTowerMeshes(root, config.meshOptimize);
    } catch (error) {
      console.error(`[tower-prep] mesh optimize failed for ${cacheKey}`, error);
    }
  }

  if (import.meta.env?.DEV) {
    const tris = countObjectTriangles(root);
    console.info(`[tower-prep] ${cacheKey}: ${tris.toLocaleString()} triangles`);
  }

  const fitted = new THREE.Box3().setFromObject(root);
  const baseLift = -fitted.min.y + config.baseClearance;

  root.matrixAutoUpdate = false;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) mesh.matrixAutoUpdate = false;
  });

  const prepared = { root, baseLift };
  sceneCache.set(cacheKey, prepared);
  notifyTowerScenePrepared();
  return prepared;
}

export function getCachedTowerScene(
  cacheKey: string
): PreparedTowerScene | null {
  return sceneCache.get(cacheKey) ?? null;
}

export function isTowerScenePrepared(cacheKey: string): boolean {
  return sceneCache.has(cacheKey);
}

/** Async prep on idle time — never blocks scroll or first paint */
export function scheduleTowerScenePrepare(
  gltfScene: THREE.Object3D,
  cacheKey: string,
  config: TowerPrepConfig
): Promise<PreparedTowerScene> {
  if (sceneCache.has(cacheKey)) {
    return Promise.resolve(sceneCache.get(cacheKey)!);
  }

  return new Promise((resolve) => {
    const run = () => resolve(prepareTowerSceneFromGltf(gltfScene, cacheKey, config));

    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(run, { timeout: 3000 });
    } else {
      window.setTimeout(run, 16);
    }
  });
}
