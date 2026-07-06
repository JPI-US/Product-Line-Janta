import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader, MeshoptDecoder } from "three-stdlib";
import {
  UTILITY_GLTF_URL,
  UTILITY_MODEL_URL,
  UTILITY_WEB_MODEL_URL,
} from "./towerModelUrls";
import {
  isTowerScenePrepared,
  scheduleTowerScenePrepare,
  TOWER_PREP_KEYS,
} from "./towerScenePrep";
import { USE_UTILITY_PRERENDER } from "./towerCanvasMode";
import { UTILITY_SCENE } from "./utilitySceneConfig";
import { shouldStartUtilityPreload } from "./utilityPreloadGate";
import { subscribeTowerScrollOffset } from "./towerScrollOffset";

/** Isolated manager — never touch DefaultLoadingManager (drei Loader listens to that) */
const utilityLoadManager = new THREE.LoadingManager();

function prepUtilityScene(
  scene: THREE.Object3D,
  skipMeshOptimize: boolean
): Promise<void> {
  return scheduleTowerScenePrepare(scene, TOWER_PREP_KEYS.utility, {
    scale: UTILITY_SCENE.tower.scale,
    baseClearance: UTILITY_SCENE.tower.baseClearance,
    skipMeshOptimize,
  }).then(() => undefined);
}

function loadUtilityGltf(
  url: string,
  skipMeshOptimize: boolean,
  useMeshopt: boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader(utilityLoadManager);
    if (useMeshopt) {
      loader.setMeshoptDecoder(
        typeof MeshoptDecoder === "function" ? MeshoptDecoder() : MeshoptDecoder
      );
    }

    loader.load(
      url,
      (gltf) => {
        void prepUtilityScene(gltf.scene, skipMeshOptimize);
        resolve();
      },
      undefined,
      reject
    );
  });
}

/**
 * Utility GLB loads off the global progress tracker so a failed/hung asset
 * cannot block the page. Deferred until after intro scroll to reduce jank.
 */
export function TowerModelPreload() {
  const startedRef = useRef(false);

  useEffect(() => {
    if (USE_UTILITY_PRERENDER) return;
    if (isTowerScenePrepared(TOWER_PREP_KEYS.utility)) return;

    let cancelled = false;

    const startLoad = () => {
      if (cancelled || startedRef.current) return;
      if (!shouldStartUtilityPreload()) return;
      startedRef.current = true;

      void (async () => {
        try {
          await loadUtilityGltf(UTILITY_MODEL_URL, true, true);
        } catch (readyError) {
          console.warn(
            "[tower-preload] ready GLB failed, falling back to web GLB",
            readyError
          );
          if (cancelled || isTowerScenePrepared(TOWER_PREP_KEYS.utility)) return;
          try {
            await loadUtilityGltf(UTILITY_WEB_MODEL_URL, false, false);
          } catch (webError) {
            console.warn(
              "[tower-preload] web GLB failed, falling back to gltf",
              webError
            );
            if (cancelled || isTowerScenePrepared(TOWER_PREP_KEYS.utility)) return;
            try {
              await loadUtilityGltf(UTILITY_GLTF_URL, false, false);
            } catch (gltfError) {
              console.error("[tower-preload] utility GLB failed", gltfError);
            }
          }
        }
      })();
    };

    startLoad();
    const unsubScroll = subscribeTowerScrollOffset(startLoad);
    const fallback = window.setTimeout(startLoad, 3500);

    return () => {
      cancelled = true;
      unsubScroll();
      window.clearTimeout(fallback);
    };
  }, []);

  return null;
}
