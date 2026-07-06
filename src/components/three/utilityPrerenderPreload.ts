import {
  getUtilityPrerenderFrameUrl,
  UTILITY_PRERENDER,
  type UtilityPrerenderManifest,
} from "./utilityPrerenderConfig";

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const loadedImages = new Map<string, HTMLImageElement>();

export function loadPrerenderFrame(url: string): Promise<HTMLImageElement> {
  const resolved = loadedImages.get(url);
  if (resolved) return Promise.resolve(resolved);

  const existing = imageCache.get(url);
  if (existing) return existing;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      loadedImages.set(url, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`prerender load failed: ${url}`));
    img.src = url;
  });
  imageCache.set(url, promise);
  return promise;
}

export function getResolvedPrerenderImage(
  url: string
): HTMLImageElement | undefined {
  return loadedImages.get(url);
}

/** Fetch manifest + warm all rotation frames (background, batched). */
export function preloadUtilityPrerenderFrames(): Promise<UtilityPrerenderManifest | null> {
  return fetch(UTILITY_PRERENDER.manifestUrl)
    .then((res) => {
      if (!res.ok) throw new Error(`manifest ${res.status}`);
      return res.json() as Promise<UtilityPrerenderManifest>;
    })
    .then(async (manifest) => {
      const urls = Array.from({ length: manifest.frameCount }, (_, i) =>
        getUtilityPrerenderFrameUrl(i, manifest)
      );
      const batchSize = 8;
      for (let i = 0; i < urls.length; i += batchSize) {
        await Promise.all(
          urls.slice(i, i + batchSize).map((url) => loadPrerenderFrame(url))
        );
      }
      return manifest;
    })
    .catch(() => null);
}
