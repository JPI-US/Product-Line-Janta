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

export const SCALE_PRESETS_MW = [0.5, 1, 5, 10] as const;
export const SCALE_MIN_MW = 0.5;
export const SCALE_MAX_MW = 10;

/** Annual energy = kW × 8760 h × capacity factor. */
export const CAPACITY_FACTOR = {
  traditional: 0.2,
  janta: 0.27,
} as const;

const HOURS_PER_YEAR = 8760;

/** Annual generation in MWh for a given system size (MW). */
export function annualMwhAt(mw: number): { traditional: number; janta: number } {
  const kw = mw * 1000;
  return {
    traditional: (kw * HOURS_PER_YEAR * CAPACITY_FACTOR.traditional) / 1000,
    janta: (kw * HOURS_PER_YEAR * CAPACITY_FACTOR.janta) / 1000,
  };
}

export function formatMwh(mwh: number): string {
  return Math.round(mwh).toLocaleString("en-US");
}

export function acresAt(mw: number): { traditional: number; janta: number } {
  return {
    traditional: mw * LAND_PER_MW.traditional,
    janta: mw * LAND_PER_MW.janta,
  };
}

export function savedAcresAt(mw: number): number {
  return mw * (LAND_PER_MW.traditional - LAND_PER_MW.janta);
}

export function footballFieldsAt(mw: number): number {
  return savedAcresAt(mw) / ACRES_PER_FOOTBALL_FIELD;
}

/** Block count for a footprint grid (min 1 so a side never renders empty). */
export function blocksForAcres(acres: number): number {
  return Math.max(1, Math.round(acres / ACRES_PER_BLOCK));
}

/** Round MW for display: 0.5 shows "0.5", whole numbers show as integers. */
export function formatMw(mw: number): string {
  return Number.isInteger(mw) ? String(mw) : mw.toFixed(1);
}

/** Round acres for readouts. */
export function formatAcres(acres: number): string {
  return Math.round(acres).toLocaleString("en-US");
}
