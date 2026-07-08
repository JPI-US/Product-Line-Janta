/** Shared mesh bake / runtime prep — same tuning for designer and utility product pages */
export const PRODUCT_TOWER_PREP = {
  meshOptimize: {
    structureCastShadow: false,
    topSurfaceSimplifyKeepRatio: 0.45,
    topSurfaceNormalMinY: 0.5,
  },
} as const;

/** Product scroll canvas perf (shadows off, compact lighting, skip runtime merge when using *-ready.glb) */
export const PRODUCT_TOWER_PERF = {
  castShadow: false,
  lightingVariant: "utility" as const,
  skipMeshOptimize: true,
  environmentIntensity: 0.46,
};
