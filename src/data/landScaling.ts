/**
 * Land-footprint scaling model for the marketing "vs" scale story.
 *
 * PROVISIONAL per-MW land intensity — pending CEO sign-off. Traditional at
 * 6.6 acres/MW keeps this section internally consistent with the 500 kW photo
 * card above it (3.3 acres at 0.5 MW). Janta at 2 acres/MW matches ROI_COMPARE.
 * These are the single source of truth for every slider position, so blessing
 * them once makes the whole widget defensible. Bumping traditional to a round
 * 7 acres/MW is a one-line change here (and would nudge the card to 3.5).
 */
export const LAND_PER_MW = {
  traditional: 6.6,
  janta: 2,
} as const;

/** American football field incl. end zones ≈ 1.32 acres. */
const ACRES_PER_FOOTBALL_FIELD = 1.32;

/** Each footprint block represents this many acres. */
export const ACRES_PER_BLOCK = 3;

export const SCALE_PRESETS_MW = [0.5, 1, 5, 10] as const;
export const SCALE_MIN_MW = 0.5;
export const SCALE_MAX_MW = 10;

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
