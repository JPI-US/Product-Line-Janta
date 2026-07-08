/** SVG paths matched to the original designer power curve reference (kW on 0–5 scale) */

export type ChartGeom = {
  x: (hour: number) => number;
  y: (kw: number) => number;
};

export const CHART_COLOR_TRADITIONAL = "#6eb8e0";
export const CHART_COLOR_JANTA = "#e8bc58";

/** Y-axis top — reference charts use 0–5 kW */
export const CHART_Y_MAX = 5;

/** Reference nameplate values (5 kW baseline), not scaled to tower kW */
export const REF_TRAD_SUMMER_PEAK_KW = 4.5;
export const REF_JANTA_SUMMER_PEAK_KW = 4.5;
export const REF_JANTA_SUMMER_TROUGH_KW = 3.4;
/** Just under 4 kW on the 0–5 axis */
export const REF_TRAD_WINTER_PEAK_KW = 3.98;
export const REF_JANTA_WINTER_PEAK_KW = 4.6;

function fmt(n: number): string {
  return n.toFixed(2);
}

/**
 * Smooth symmetric bell (parabolic arc).
 * Quadratic control is placed at 2× peak kW so the curve apex hits peakKw
 * (a control at peakKw would only reach half height with zero endpoints).
 */
export function bellCurvePath(
  geom: ChartGeom,
  startHour: number,
  endHour: number,
  peakHour: number,
  peakKw: number
): string {
  const x0 = geom.x(startHour);
  const xP = geom.x(peakHour);
  const x1 = geom.x(endHour);
  const y0 = geom.y(0);
  const yCtrl = geom.y(peakKw * 2);

  return `M ${fmt(x0)} ${fmt(y0)} Q ${fmt(xP)} ${fmt(yCtrl)} ${fmt(x1)} ${fmt(y0)}`;
}

/** Summer traditional — smooth bell across the full plotted day */
export function traditionalSummerPath(
  geom: ChartGeom,
  hourMin = 7,
  hourMax = 22,
  peakKw: number = REF_TRAD_SUMMER_PEAK_KW
): string {
  const peakHour = hourMin + (hourMax - hourMin) * 0.5;
  return bellCurvePath(geom, hourMin, hourMax, peakHour, peakKw);
}

/** Summer Janta — M-curve: morning peak, midday trough, evening peak. */
export function jantaSummerPath(
  geom: ChartGeom,
  hourMin = 7,
  hourMax = 22,
  peakKw: number = REF_JANTA_SUMMER_PEAK_KW,
  troughKw: number = REF_JANTA_SUMMER_TROUGH_KW
): string {
  const span = hourMax - hourMin;
  const at = (fraction: number) => hourMin + span * fraction;
  const y0 = geom.y(0);
  const yPeak = geom.y(peakKw);
  const yTrough = geom.y(troughKw);

  return [
    `M ${fmt(geom.x(hourMin))} ${fmt(y0)}`,
    `L ${fmt(geom.x(at(0.067)))} ${fmt(yPeak * 0.96)}`,
    `L ${fmt(geom.x(at(0.2)))} ${fmt(yPeak)}`,
    `Q ${fmt(geom.x(at(0.5)))} ${fmt(yTrough)} ${fmt(geom.x(at(0.733)))} ${fmt(yPeak)}`,
    `L ${fmt(geom.x(at(0.867)))} ${fmt(yPeak)}`,
    `L ${fmt(geom.x(at(0.933)))} ${fmt(yPeak)}`,
    `L ${fmt(geom.x(hourMax))} ${fmt(y0)}`,
  ].join(" ");
}

/** Winter Janta — plateau across daylight, anchored to chart edges */
export function jantaWinterPath(
  geom: ChartGeom,
  hourMin = 7,
  hourMax = 21,
  peakKw: number = REF_JANTA_WINTER_PEAK_KW
): string {
  const y0 = geom.y(0);
  const yPeak = geom.y(peakKw);
  const span = hourMax - hourMin;
  const riseEnd = hourMin + span * 0.2;
  const plateauEnd = hourMin + span * 0.8;

  return [
    `M ${fmt(geom.x(hourMin))} ${fmt(y0)}`,
    `L ${fmt(geom.x(riseEnd))} ${fmt(yPeak)}`,
    `L ${fmt(geom.x(plateauEnd))} ${fmt(yPeak)}`,
    `L ${fmt(geom.x(hourMax))} ${fmt(y0)}`,
  ].join(" ");
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** kW at hour — traditional bell (matches bellCurvePath) */
export function tradBellKw(
  hour: number,
  hourMin: number,
  hourMax: number,
  peakKw: number,
): number {
  if (hour <= hourMin || hour >= hourMax) return 0;
  const peakHour = (hourMin + hourMax) / 2;
  const half = (hourMax - hourMin) / 2;
  const t = (hour - peakHour) / half;
  return Math.max(0, peakKw * (1 - t * t));
}

/** kW at hour — summer Janta M-curve */
export function jantaSummerKw(
  hour: number,
  hourMin = 7,
  hourMax = 22,
  peakKw: number = REF_JANTA_SUMMER_PEAK_KW,
  troughKw: number = REF_JANTA_SUMMER_TROUGH_KW,
): number {
  if (hour <= hourMin || hour >= hourMax) return 0;
  const span = hourMax - hourMin;
  const at = (f: number) => hourMin + span * f;
  const h1 = at(0.067);
  const h2 = at(0.2);
  const hMid = at(0.5);
  const h3 = at(0.733);
  const h5 = at(0.933);

  if (hour <= h1) return lerp(0, peakKw * 0.96, (hour - hourMin) / (h1 - hourMin));
  if (hour <= h2) return lerp(peakKw * 0.96, peakKw, (hour - h1) / (h2 - h1));
  if (hour <= hMid) {
    const t = (hour - h2) / (hMid - h2);
    return lerp(peakKw, troughKw, t);
  }
  if (hour <= h3) {
    const t = (hour - hMid) / (h3 - hMid);
    return lerp(troughKw, peakKw, t);
  }
  if (hour <= h5) return peakKw;
  return lerp(peakKw, 0, (hour - h5) / (hourMax - h5));
}

/** kW at hour — winter Janta plateau */
export function jantaWinterKw(
  hour: number,
  hourMin = 7,
  hourMax = 21,
  peakKw: number = REF_JANTA_WINTER_PEAK_KW,
): number {
  if (hour <= hourMin || hour >= hourMax) return 0;
  const span = hourMax - hourMin;
  const riseEnd = hourMin + span * 0.2;
  const plateauEnd = hourMin + span * 0.8;
  if (hour <= riseEnd) return lerp(0, peakKw, (hour - hourMin) / (riseEnd - hourMin));
  if (hour <= plateauEnd) return peakKw;
  return lerp(peakKw, 0, (hour - plateauEnd) / (hourMax - plateauEnd));
}
