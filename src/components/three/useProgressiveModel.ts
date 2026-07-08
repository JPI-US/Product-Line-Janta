import { useEffect, useState } from "react";
import { useGLTF } from "../../three/useGLTF";
import { MODEL_LOD_URLS } from "./towerModelUrls";

/**
 * Progressive GLB loading: render the tiny `-lod2` tier first (tower on
 * screen in a few hundred ms), preload the full-res GLB in the background,
 * and swap once it's decoded. Models without LOD tiers pass through as-is.
 *
 * Returns the URL to feed `useGLTF` right now, plus whether the current
 * tier is still the low-res stand-in.
 */
export function useProgressiveModel(fullUrl: string): {
  url: string;
  isLowRes: boolean;
} {
  const lods = MODEL_LOD_URLS[fullUrl];
  const [fullReady, setFullReady] = useState(!lods);

  useEffect(() => {
    if (!lods) return;
    let cancelled = false;
    // drei caches by URL — once this resolves, swapping the hook's URL to
    // the full model resolves synchronously from cache.
    const pending = useGLTF.preload(fullUrl);
    if (pending && typeof pending.then === "function") {
      void pending.then(() => {
        if (!cancelled) setFullReady(true);
      });
    } else {
      // Older drei: preload gives no promise back; swap on the next idle
      // slot and let Suspense cover the remaining load time.
      const id = window.setTimeout(() => {
        if (!cancelled) setFullReady(true);
      }, 1500);
      return () => {
        cancelled = true;
        window.clearTimeout(id);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [fullUrl, lods]);

  if (!lods) return { url: fullUrl, isLowRes: false };
  return fullReady
    ? { url: fullUrl, isLowRes: false }
    : { url: lods.lod2, isLowRes: true };
}
