import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three-stdlib";
import {
  DESIGNER_READY_MODEL_URL,
  DESIGNER_WEB_MODEL_URL,
} from "../../components/three/towerModelUrls";
import { SCENE } from "../../components/three/sceneConfig";
import {
  getDesignerTowerPrepConfig,
  isTowerScenePrepared,
  prepareTowerSceneFromGltf,
  TOWER_PREP_KEYS,
} from "../../components/three/towerScenePrep";

let warmupPromise: Promise<void> | null = null;

const DESIGNER_LOAD_CHAIN = [
  DESIGNER_READY_MODEL_URL,
  DESIGNER_WEB_MODEL_URL,
] as const;

function loadDesignerGltf(url: string, useMeshopt: boolean): Promise<GLTF> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    if (useMeshopt) {
      loader.setMeshoptDecoder(
        typeof MeshoptDecoder === "function"
          ? (MeshoptDecoder as () => Parameters<GLTFLoader["setMeshoptDecoder"]>[0])()
          : MeshoptDecoder,
      );
    }
    loader.load(url, resolve, undefined, reject);
  });
}

function isMergedTower(scene: THREE.Object3D): boolean {
  return scene.getObjectByName("tower-merged") != null;
}

/** Parse + cache the designer tower before the hero canvas needs it */
export function warmupHeroTowerScene(): Promise<void> {
  if (isTowerScenePrepared(TOWER_PREP_KEYS.designer)) {
    return Promise.resolve();
  }
  if (warmupPromise) return warmupPromise;

  warmupPromise = (async () => {
    for (let i = 0; i < DESIGNER_LOAD_CHAIN.length; i++) {
      const url = DESIGNER_LOAD_CHAIN[i];
      try {
        const gltf = await loadDesignerGltf(url, i < 2);
        if (isTowerScenePrepared(TOWER_PREP_KEYS.designer)) return;

        const merged = isMergedTower(gltf.scene);
        prepareTowerSceneFromGltf(
          gltf.scene,
          TOWER_PREP_KEYS.designer,
          merged
            ? getDesignerTowerPrepConfig()
            : {
                scale: SCENE.tower.scale,
                baseClearance: SCENE.tower.baseClearance,
                skipMeshOptimize: false,
                meshOptimize: SCENE.tower.prep.meshOptimize,
              },
        );
        return;
      } catch {
        // try next URL in chain
      }
    }
    console.error("[hero-warmup] designer tower failed — ready and web");
  })();

  return warmupPromise;
}
