/**
 * Runtime model assets. Only the optimized, self-contained GLBs ship in the
 * build (`public/models/`). Raw CAD `.gltf` + `.bin` sources live in
 * `model-sources/` (out of the deploy) and feed `npm run optimize:models`.
 */
export const DESIGNER_WEB_MODEL_URL =
  "/models/5.6k_10x4_panels/5.6k_10x4_panels-web.glb";
export const DESIGNER_READY_MODEL_URL =
  "/models/5.6k_10x4_panels/5.6k_10x4_panels-ready.glb";
export const DESIGNER_LOD1_MODEL_URL =
  "/models/5.6k_10x4_panels/5.6k_10x4_panels-ready-lod1.glb";
export const DESIGNER_LOD2_MODEL_URL =
  "/models/5.6k_10x4_panels/5.6k_10x4_panels-ready-lod2.glb";

export const UTILITY_READY_MODEL_URL =
  "/models/tr-08-001/TR-08-001-ready.glb";
export const UTILITY_LOD1_MODEL_URL =
  "/models/tr-08-001/TR-08-001-ready-lod1.glb";
export const UTILITY_LOD2_MODEL_URL =
  "/models/tr-08-001/TR-08-001-ready-lod2.glb";

/** LOD tiers emitted by `npm run optimize:models`, keyed by the full-res URL. */
export const MODEL_LOD_URLS: Record<string, { lod1: string; lod2: string }> = {
  [DESIGNER_READY_MODEL_URL]: {
    lod1: DESIGNER_LOD1_MODEL_URL,
    lod2: DESIGNER_LOD2_MODEL_URL,
  },
  [UTILITY_READY_MODEL_URL]: {
    lod1: UTILITY_LOD1_MODEL_URL,
    lod2: UTILITY_LOD2_MODEL_URL,
  },
};
/** Utility has no separate meshopt "-web" tier; reuse the local ready GLB. */
export const UTILITY_WEB_MODEL_URL = UTILITY_READY_MODEL_URL;

/**
 * Primary URLs — the meshopt-compressed "ready" GLB is the production tier
 * (also preloaded in index.html and used by the hero warmup), so every entry
 * path renders the same mesh.
 */
export const DESIGNER_MODEL_URL = DESIGNER_READY_MODEL_URL;
export const UTILITY_MODEL_URL = UTILITY_READY_MODEL_URL;
