import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader, MeshoptDecoder } from "three-stdlib";
import type { ProductId } from "../../data/productPages";
import {
  DESIGNER_GLTF_URL,
  DESIGNER_WEB_MODEL_URL,
  UTILITY_GLTF_URL,
  UTILITY_WEB_MODEL_URL,
} from "./towerModelUrls";
import {
  isTowerScenePrepared,
  scheduleTowerScenePrepare,
} from "./towerScenePrep";
import { PRODUCT_SCENES } from "./productScene";
import { SCENE } from "./sceneConfig";

const productLoadManager = new THREE.LoadingManager();

const PRODUCT_LOAD_FALLBACKS: Record<
  ProductId,
  { web: string; gltf: string }
> = {
  designer: { web: DESIGNER_WEB_MODEL_URL, gltf: DESIGNER_GLTF_URL },
  utility: { web: UTILITY_WEB_MODEL_URL, gltf: UTILITY_GLTF_URL },
};

function loadProductGltf(
  prepKey: string,
  url: string,
  skipMeshOptimize: boolean,
  useMeshopt: boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader(productLoadManager);
    if (useMeshopt) {
      loader.setMeshoptDecoder(
        typeof MeshoptDecoder === "function" ? MeshoptDecoder() : MeshoptDecoder
      );
    }
    loader.load(
      url,
      (gltf) => {
        void scheduleTowerScenePrepare(gltf.scene, prepKey, {
          scale: SCENE.tower.scale,
          baseClearance: SCENE.tower.baseClearance,
          skipMeshOptimize,
        });
        resolve();
      },
      undefined,
      reject
    );
  });
}

/** Loads the active product GLB with ready → web → gltf fallbacks */
export function ProductModelPreload({ productId }: { productId: ProductId }) {
  const startedRef = useRef(false);

  useEffect(() => {
    const config = PRODUCT_SCENES[productId];
    if (isTowerScenePrepared(config.prepKey)) return;

    let cancelled = false;
    const fallbacks = PRODUCT_LOAD_FALLBACKS[productId];

    const startLoad = () => {
      if (cancelled || startedRef.current) return;
      startedRef.current = true;
      void (async () => {
        try {
          await loadProductGltf(config.prepKey, config.modelUrl, true, true);
        } catch {
          if (cancelled || isTowerScenePrepared(config.prepKey)) return;
          try {
            await loadProductGltf(
              config.prepKey,
              fallbacks.web,
              false,
              false
            );
          } catch {
            if (cancelled || isTowerScenePrepared(config.prepKey)) return;
            try {
              await loadProductGltf(
                config.prepKey,
                fallbacks.gltf,
                false,
                false
              );
            } catch (e) {
              console.error(`[product-preload] ${productId} failed`, e);
            }
          }
        }
      })();
    };

    startLoad();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  return null;
}
