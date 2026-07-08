/** Idle redraw cap while a tower canvas is visible (30fps — smooth enough, half the GPU load) */
export const TOWER_IDLE_INVALIDATE_MS = 1000 / 30;

/** Scroll-driven WebGL redraw cap (damping still runs every frame) */
export const SCROLL_INVALIDATE_MS = 1000 / 30;

export const SCROLL_OFFSET_EPS = 2.5e-4;

/** @deprecated Use TOWER_IDLE_INVALIDATE_MS */
export const UTILITY_IDLE_INVALIDATE_MS = TOWER_IDLE_INVALIDATE_MS;
