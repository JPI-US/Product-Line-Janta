/**
 * Model assets — run `npm run optimize:models` for *-web.glb / *-ready.glb.
 * Falls back to .gltf sources when optimized files are not present.
 */
export const DESIGNER_GLTF_URL =
  "/models/5.6k_10x4_panels/5.6k_10x4_panels.gltf";
export const DESIGNER_WEB_MODEL_URL =
  "/models/5.6k_10x4_panels/5.6k_10x4_panels-web.glb";
export const DESIGNER_READY_MODEL_URL =
  "/models/5.6k_10x4_panels/5.6k_10x4_panels-ready.glb";

export const UTILITY_GLTF_URL = "/models/tr-08-001/TR-08-001.gltf";
export const UTILITY_READY_MODEL_URL =
  "/models/tr-08-001/TR-08-001-ready.glb";
export const UTILITY_WEB_MODEL_URL =
  "/models/tr-08-001/TR-08-001-web.glb";

/** Primary URLs — merged *-ready.glb (run npm run optimize:models) */
export const DESIGNER_MODEL_URL = DESIGNER_READY_MODEL_URL;
export const UTILITY_MODEL_URL = UTILITY_READY_MODEL_URL;
