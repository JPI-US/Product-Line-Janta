import { SHADOWS_ENABLED } from "./sceneConfig";

/** Shared mesh bake / runtime prep — same tuning for designer and utility product pages */
export const PRODUCT_TOWER_PREP = {
  meshOptimize: {
    topSurfaceSimplifyKeepRatio: 0.45,
    topSurfaceNormalMinY: 0.5,
  },
} as const;

/** DSR designer hero — defined shadow map on desktop, compact contact shadow on mobile */
export const DESIGNER_PRODUCT_PERF = {
  castShadow: SHADOWS_ENABLED,
  contactShadow: true,
  lightingVariant: "designer" as const,
  skipMeshOptimize: true,
  environmentIntensity: 0.42,
  meshOptimize: {
    ...PRODUCT_TOWER_PREP.meshOptimize,
    structureCastShadow: false,
  },
} as const;

/** LFM utility hero — defined shadow map on desktop, compact contact shadow on mobile */
export const UTILITY_PRODUCT_PERF = {
  castShadow: SHADOWS_ENABLED,
  contactShadow: true,
  lightingVariant: "utility" as const,
  skipMeshOptimize: true,
  environmentIntensity: 0.46,
  meshOptimize: {
    ...PRODUCT_TOWER_PREP.meshOptimize,
    structureCastShadow: false,
  },
} as const;

/** @deprecated Use DESIGNER_PRODUCT_PERF / UTILITY_PRODUCT_PERF */
export const PRODUCT_TOWER_PERF = UTILITY_PRODUCT_PERF;
