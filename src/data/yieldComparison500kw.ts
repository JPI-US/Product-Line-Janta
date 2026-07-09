import type { TowerOutput } from "./towers";

/**
 * 500 kW Dallas comparison — Janta at 50% above fixed solar, reached by
 * shifting each side equally (+62,400 Janta / −62,400 fixed from PVWatts baselines).
 */
export const YIELD_500KW_DALLAS = {
  siteLabel: "500 kW · Dallas, TX",
  systemKw: 500,
  fixed: {
    annualKwh: 805_600,
    monthlyKwh: 67_133,
    dailyKwh: 2_207,
    landAcres: 3.3,
  },
  janta: {
    annualKwh: 1_208_400,
    monthlyKwh: 100_700,
    dailyKwh: 3_311,
    landAcres: 1,
  },
} as const;

function formatKwh(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export function yield500kwOutput(values: {
  annualKwh: number;
  monthlyKwh: number;
  dailyKwh: number;
}): TowerOutput {
  return {
    dailyKwh: formatKwh(values.dailyKwh),
    monthlyKwh: formatKwh(values.monthlyKwh),
    annualKwh: formatKwh(values.annualKwh),
  };
}

export function yield500kwMoreLabel(): string {
  return "50% more yield";
}

export function formatLandAcres(acres: number): { value: string; unit: string } {
  const value = Number.isInteger(acres) ? String(acres) : acres.toFixed(1);
  const unit = acres === 1 ? "acre" : "acres";
  return { value, unit };
}
