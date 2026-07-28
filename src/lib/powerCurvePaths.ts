/** SVG paths matched to the designer power-curve reference (kW on 0–5 scale) */

export type ChartGeom = {
  x: (hour: number) => number;
  y: (kw: number) => number;
};

export const CHART_COLOR_TRADITIONAL = "#ffbf14";
export const CHART_COLOR_JANTA = "#3a84dc";

/** Y-axis top — reference charts use 0–5 kW */
export const CHART_Y_MAX = 5;

/** Reference nameplate values (5 kW baseline), not scaled to tower kW */
export const REF_TRAD_SUMMER_PEAK_KW = 4.5;
export const REF_JANTA_SUMMER_PEAK_KW = 4.5;
/** Midday trough ~68% of peak — soft M, not a deep cut */
export const REF_JANTA_SUMMER_TROUGH_KW = 3.05;
/** Winter fixed peak ~80% of the Janta plateau — clear gap, no crossover */
export const REF_TRAD_WINTER_PEAK_KW = 3.7;
export const REF_JANTA_WINTER_PEAK_KW = 4.6;

/** Summer daylight — 6am to 8pm, mirrored about midday */
export const JANTA_SUMMER_HOUR_MIN = 6;
export const JANTA_SUMMER_HOUR_MAX = 20;
/** Fixed solar starts ~1h after Janta, centered under the day */
export const TRAD_SUMMER_HOUR_MIN = 7;
export const TRAD_SUMMER_HOUR_MAX = 19;

/** Winter daylight — 9am to 7pm, mirrored about midday */
export const WINTER_CHART_HOUR_MIN = 9;
export const WINTER_CHART_HOUR_MAX = 19;
export const JANTA_WINTER_HOUR_MIN = 9;
export const JANTA_WINTER_HOUR_MAX = 19;
/** Fixed solar centered under Janta; starts at 9:32 */
const WINTER_JANTA_MID =
  (JANTA_WINTER_HOUR_MIN + JANTA_WINTER_HOUR_MAX) / 2;
export const TRAD_WINTER_HOUR_MIN = 9 + 32 / 60;
export const TRAD_WINTER_HOUR_MAX =
  WINTER_JANTA_MID + (WINTER_JANTA_MID - TRAD_WINTER_HOUR_MIN);

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
  peakKw: number,
): string {
  const x0 = geom.x(startHour);
  const xP = geom.x(peakHour);
  const x1 = geom.x(endHour);
  const y0 = geom.y(0);
  const yCtrl = geom.y(peakKw * 2);

  return `M ${fmt(x0)} ${fmt(y0)} Q ${fmt(xP)} ${fmt(yCtrl)} ${fmt(x1)} ${fmt(y0)}`;
}

/** Summer traditional — smooth bell, delayed vs Janta dawn */
export function traditionalSummerPath(
  geom: ChartGeom,
  hourMin = TRAD_SUMMER_HOUR_MIN,
  hourMax = TRAD_SUMMER_HOUR_MAX,
  peakKw: number = REF_TRAD_SUMMER_PEAK_KW,
): string {
  const peakHour = hourMin + (hourMax - hourMin) * 0.5;
  return bellCurvePath(geom, hourMin, hourMax, peakHour, peakKw);
}

/**
 * Summer Janta — M-profile: steep rise, morning plateau, midday saddle,
 * evening plateau, steep fall. Sampled so the drawn line matches hover kW.
 */
export function jantaSummerPath(
  geom: ChartGeom,
  hourMin = JANTA_SUMMER_HOUR_MIN,
  hourMax = JANTA_SUMMER_HOUR_MAX,
  peakKw: number = REF_JANTA_SUMMER_PEAK_KW,
  troughKw: number = REF_JANTA_SUMMER_TROUGH_KW,
): string {
  const steps = 180;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const hour = hourMin + ((hourMax - hourMin) * i) / steps;
    const kw = jantaSummerKw(hour, hourMin, hourMax, peakKw, troughKw);
    parts.push(`${i === 0 ? "M" : "L"} ${fmt(geom.x(hour))} ${fmt(geom.y(kw))}`);
  }
  return parts.join(" ");
}

/**
 * Winter Janta — boxy plateau with short rounded shoulders.
 * Sampled from jantaWinterKw so the drawn line always matches the hover readout.
 */
export function jantaWinterPath(
  geom: ChartGeom,
  hourMin = JANTA_WINTER_HOUR_MIN,
  hourMax = JANTA_WINTER_HOUR_MAX,
  peakKw: number = REF_JANTA_WINTER_PEAK_KW,
): string {
  const steps = 72;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const hour = hourMin + ((hourMax - hourMin) * i) / steps;
    const kw = jantaWinterKw(hour, hourMin, hourMax, peakKw);
    parts.push(`${i === 0 ? "M" : "L"} ${fmt(geom.x(hour))} ${fmt(geom.y(kw))}`);
  }
  return parts.join(" ");
}

/** Eases in and out with zero slope at both ends — rounds the plateau corners. */
function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
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

/**
 * kW at hour — summer Janta M-shape.
 * Each peak is one parabola (same curvature inside and out). Peaks are
 * mirrored about midday so both lobes are the same length.
 * Joins are C1-matched so the line doesn't show seams.
 */
export function jantaSummerKw(
  hour: number,
  hourMin = JANTA_SUMMER_HOUR_MIN,
  hourMax = JANTA_SUMMER_HOUR_MAX,
  peakKw: number = REF_JANTA_SUMMER_PEAK_KW,
  troughKw: number = REF_JANTA_SUMMER_TROUGH_KW,
): number {
  if (hour <= hourMin || hour >= hourMax) return 0;

  const dayMid = (hourMin + hourMax) / 2;
  const amPeak = 9 + 15 / 60; // 9:15
  const pmPeak = 2 * dayMid - amPeak;

  const gapHalf = 0.72; // shorter mid gap; peaks run longer toward center
  const mesaHalf = (pmPeak - amPeak) / 2 - gapHalf;
  const dipStart = amPeak + mesaHalf;
  const dipEnd = pmPeak - mesaHalf;
  const dipMid = (dipStart + dipEnd) / 2;
  const dipHalf = gapHalf;

  // Curvature chosen so parabola ↔ dip share the same edge slope (no kink)
  const a =
    (peakKw - troughKw) /
    Math.max(mesaHalf * (mesaHalf + dipHalf), 0.001);
  const joinKw = peakKw - a * mesaHalf * mesaHalf;

  const parabola = (h: number, peak: number) =>
    Math.max(0, peakKw - a * (h - peak) ** 2);
  const parabolaSlope = (h: number, peak: number) => -2 * a * (h - peak);

  /** Cubic Hermite in t∈[0,1]; m0/m1 are dy/dt. */
  const hermite = (t: number, y0: number, y1: number, m0: number, m1: number) => {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * y0 +
      (t3 - 2 * t2 + t) * m0 +
      (-2 * t3 + 3 * t2) * y1 +
      (t3 - t2) * m1
    );
  };

  // Soft outer skirts with matching slope into the parabola (avoids a vertical shoot)
  const outerRamp = 1.5;
  const amJoin = hourMin + outerRamp;
  const pmJoin = hourMax - outerRamp;

  if (hour < amJoin) {
    const y1 = parabola(amJoin, amPeak);
    const t = (hour - hourMin) / outerRamp;
    return hermite(t, 0, y1, 0, parabolaSlope(amJoin, amPeak) * outerRamp);
  }
  if (hour > pmJoin) {
    const y0 = parabola(pmJoin, pmPeak);
    const t = (hour - pmJoin) / outerRamp;
    return hermite(t, y0, 0, parabolaSlope(pmJoin, pmPeak) * outerRamp, 0);
  }

  if (hour <= dipStart) return parabola(hour, amPeak);
  if (hour >= dipEnd) return parabola(hour, pmPeak);

  // Same-family parabolic bowl — C1 with the peak lobes
  const x = Math.min(1, Math.abs((hour - dipMid) / dipHalf));
  return troughKw + (joinKw - troughKw) * x * x;
}

/**
 * kW at hour — winter Janta: steep rise, long flat plateau, steep fall
 * (equal ramps, always above the fixed bell).
 */
export function jantaWinterKw(
  hour: number,
  hourMin = JANTA_WINTER_HOUR_MIN,
  hourMax = JANTA_WINTER_HOUR_MAX,
  peakKw: number = REF_JANTA_WINTER_PEAK_KW,
): number {
  if (hour <= hourMin || hour >= hourMax) return 0;
  const span = hourMax - hourMin;
  const rampH = span * 0.14;
  const riseEnd = hourMin + rampH;
  const fallStart = hourMax - rampH;
  if (hour <= riseEnd) {
    return peakKw * smoothstep((hour - hourMin) / rampH);
  }
  if (hour <= fallStart) return peakKw;
  return peakKw * smoothstep((hourMax - hour) / rampH);
}
