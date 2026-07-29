/**
 * Land-footprint scaling model for the marketing "vs" scale story.
 *
 * Per-MW land intensity from Janta's financial/operational model (CEO-blessed):
 * Fixed Tilt 6.67 acres/MW, Janta 2.22 acres/MW → 4.44 acres saved per MW.
 * These stay consistent with the 500 kW photo card above (6.67 × 0.5 ≈ 3.3
 * acres traditional, 2.22 × 0.5 ≈ 1.1 → 1 acre Janta) and are the single source
 * of truth for every slider position, so the whole widget is defensible.
 */
export const LAND_PER_MW = {
  traditional: 6.67,
  janta: 2.22,
} as const;

/** American football field incl. end zones ≈ 1.32 acres. */
const ACRES_PER_FOOTBALL_FIELD = 1.32;

/** Each footprint block represents this many acres. */
export const ACRES_PER_BLOCK = 3;

/* More stops so the auto-play story steps through the scale rather than jumping. */
export const SCALE_PRESETS_MW = [0.5, 1, 2, 5, 10, 20, 50] as const;
/* Floor the slider at 0.1 MW (100 kW). At the low end, rounded acreage can
   drop below 1 acre on the denser Janta side. */
export const SCALE_MIN_MW = 0.3;
export const SCALE_MAX_MW = 50;
const MAX_FOOTPRINT_BLOCKS = Math.ceil((SCALE_MAX_MW * LAND_PER_MW.traditional) / ACRES_PER_BLOCK);

function floorAtZero(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** Annual energy = kW × 8760 h × capacity factor. */
export const CAPACITY_FACTOR = {
  traditional: 0.2,
  janta: 0.27,
} as const;

const HOURS_PER_YEAR = 8760;

/** Annual generation in MWh for a given system size (MW). */
export function annualMwhAt(mw: number): { traditional: number; janta: number } {
  const kw = clampScaleMw(mw) * 1000;
  return {
    traditional: (kw * HOURS_PER_YEAR * CAPACITY_FACTOR.traditional) / 1000,
    janta: (kw * HOURS_PER_YEAR * CAPACITY_FACTOR.janta) / 1000,
  };
}

export function formatMwh(mwh: number): string {
  return Math.round(floorAtZero(mwh)).toLocaleString("en-US");
}

export function acresAt(mw: number): { traditional: number; janta: number } {
  const safeMw = clampScaleMw(mw);
  return {
    traditional: safeMw * LAND_PER_MW.traditional,
    janta: safeMw * LAND_PER_MW.janta,
  };
}

export function savedAcresAt(mw: number): number {
  return clampScaleMw(mw) * (LAND_PER_MW.traditional - LAND_PER_MW.janta);
}

export function footballFieldsAt(mw: number): number {
  return savedAcresAt(mw) / ACRES_PER_FOOTBALL_FIELD;
}

/** Block count for a footprint grid, capped so bad input cannot flood the DOM. */
export function blocksForAcres(acres: number): number {
  const safeAcres = floorAtZero(acres);
  if (safeAcres === 0) return 0;
  return Math.min(MAX_FOOTPRINT_BLOCKS, Math.max(1, Math.round(safeAcres / ACRES_PER_BLOCK)));
}

export function clampScaleMw(mw: number): number {
  if (!Number.isFinite(mw)) return SCALE_MIN_MW;
  return Math.min(SCALE_MAX_MW, Math.max(SCALE_MIN_MW, mw));
}

/** Round MW for display: decimals show one place, whole numbers show as integers. */
export function formatMw(mw: number): string {
  const safeMw = clampScaleMw(mw);
  return Number.isInteger(safeMw) ? String(safeMw) : safeMw.toFixed(1);
}

/** Round acres for readouts. */
export function formatAcres(acres: number): string {
  return Math.round(floorAtZero(acres)).toLocaleString("en-US");
}
