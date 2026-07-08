import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { configureGltfLoaders } from "../../three/loaders";
import type { ProductId } from "../../data/productPages";
import {
  DESIGNER_READY_MODEL_URL,
  DESIGNER_WEB_MODEL_URL,
  MODEL_LOD_URLS,
  UTILITY_READY_MODEL_URL,
  UTILITY_WEB_MODEL_URL,
} from "./towerModelUrls";
import {
  getLodPrepKey,
  isTowerScenePrepared,
  scheduleTowerScenePrepare,
} from "./towerScenePrep";
import { PRODUCT_SCENES, getProductTowerLayout } from "./productScene";

const productLoadManager = new THREE.LoadingManager();

const PRODUCT_LOAD_FALLBACKS: Record<
  ProductId,
  { ready: string; web: string }
> = {
  designer: {
    ready: DESIGNER_READY_MODEL_URL,
    web: DESIGNER_WEB_MODEL_URL,
  },
  utility: {
    ready: UTILITY_READY_MODEL_URL,
    web: UTILITY_WEB_MODEL_URL,
  },
};

function loadProductGltf(
  productId: ProductId,
  prepKey: string,
  url: string,
  skipMeshOptimize: boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    const loader = configureGltfLoaders(new GLTFLoader(productLoadManager));
    loader.load(
      url,
      (gltf) => {
        const layout = getProductTowerLayout(productId);
        void scheduleTowerScenePrepare(gltf.scene, prepKey, {
          scale: layout.scale,
          baseClearance: layout.baseClearance,
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
    const loadChain = [
      config.modelUrl,
      fallbacks.ready,
      fallbacks.web,
    ].filter((url, index, list) => list.indexOf(url) === index);

    const startLoad = () => {
      if (cancelled || startedRef.current) return;
      startedRef.current = true;
      // Progressive tier: kick the tiny -lod2 stand-in first so the tower is
      // on screen in a few hundred ms while the full GLB streams in.
      const lod2Url = MODEL_LOD_URLS[config.modelUrl]?.lod2;
      if (lod2Url && !isTowerScenePrepared(getLodPrepKey(config.prepKey))) {
        void loadProductGltf(
          productId,
          getLodPrepKey(config.prepKey),
          lod2Url,
          true,
        ).catch(() => {
          /* stand-in is best-effort; full chain below still runs */
        });
      }
      void (async () => {
        for (let i = 0; i < loadChain.length; i++) {
          if (cancelled || isTowerScenePrepared(config.prepKey)) return;
          const url = loadChain[i];
          try {
            await loadProductGltf(
              productId,
              config.prepKey,
              url,
              url === fallbacks.ready,
            );
            return;
          } catch {
            // try next URL in chain
          }
        }
        console.error(`[product-preload] ${productId} failed`, loadChain);
      })();
    };

    startLoad();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  return null;
}
