import type { TowerOutput } from "../data/towers";

const RANGE_SEP = /[–-]/;

function parseKwhNumber(value: string): number {
  return Number(value.replace(/,/g, "").trim());
}

function formatKwhNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function halveRangeString(value: string): string {
  const parts = value.split(RANGE_SEP);
  if (parts.length !== 2) return value;

  const low = parseKwhNumber(parts[0]);
  const high = parseKwhNumber(parts[1]);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return value;

  return `${formatKwhNumber(low / 2)}–${formatKwhNumber(high / 2)}`;
}

/** Traditional fixed-tilt yield at 50% of the Janta band */
export function halveTowerOutput(output: TowerOutput): TowerOutput {
  return {
    dailyKwh: halveRangeString(output.dailyKwh),
    monthlyKwh: halveRangeString(output.monthlyKwh),
    annualKwh: halveRangeString(output.annualKwh),
  };
}
