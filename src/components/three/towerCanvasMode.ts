/**
 * Toggle single vs dual WebGL canvas.
 *
 * true  — one shared canvas (better performance, easier idle sync)
 * false — original two-canvas layout (rollback)
 *
 * Revert: set to false and hard-refresh /3d
 */
export const USE_UNIFIED_TOWER_CANVAS = false;

/**
 * Utility section uses baked rotation frames instead of a second WebGL canvas.
 *
 * Revert: set to false. Rebuild frames: npm run bake:utility-prerender
 */
export const USE_UTILITY_PRERENDER = true;
