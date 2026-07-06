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

/** Summer traditional — smooth symmetric bell (slight parabola, not a triangle). */
export function traditionalSummerPath(
  geom: ChartGeom,
  peakKw: number = REF_TRAD_SUMMER_PEAK_KW
): string {
  return bellCurvePath(geom, 9, 20, 14.5, peakKw);
}

/** Summer Janta — M-curve: morning peak, midday trough, evening peak. */
export function jantaSummerPath(
  geom: ChartGeom,
  peakKw: number = REF_JANTA_SUMMER_PEAK_KW,
  troughKw: number = REF_JANTA_SUMMER_TROUGH_KW
): string {
  const y0 = geom.y(0);
  const yPeak = geom.y(peakKw);
  const yTrough = geom.y(troughKw);

  return [
    `M ${fmt(geom.x(7))} ${fmt(y0)}`,
    `L ${fmt(geom.x(8))} ${fmt(yPeak * 0.96)}`,
    `L ${fmt(geom.x(10))} ${fmt(yPeak)}`,
    `Q ${fmt(geom.x(14.5))} ${fmt(yTrough)} ${fmt(geom.x(18))} ${fmt(yPeak)}`,
    `L ${fmt(geom.x(20))} ${fmt(yPeak)}`,
    `L ${fmt(geom.x(21))} ${fmt(yPeak)}`,
    `L ${fmt(geom.x(22))} ${fmt(y0)}`,
  ].join(" ");
}

/** Winter Janta — plateau: steep rise, flat top, steep fall. */
export function jantaWinterPath(
  geom: ChartGeom,
  peakKw: number = REF_JANTA_WINTER_PEAK_KW
): string {
  const y0 = geom.y(0);
  const yPeak = geom.y(peakKw);

  return [
    `M ${fmt(geom.x(9))} ${fmt(y0)}`,
    `L ${fmt(geom.x(10))} ${fmt(yPeak)}`,
    `L ${fmt(geom.x(17))} ${fmt(yPeak)}`,
    `L ${fmt(geom.x(19))} ${fmt(y0)}`,
  ].join(" ");
}
