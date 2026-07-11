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
/** Matches dashboard midday dip (~11% below peak → ~4.0 on a 4.5 scale) */
export const REF_JANTA_SUMMER_TROUGH_KW = 4.0;
/** Just under 4 kW on the 0–5 axis */
export const REF_TRAD_WINTER_PEAK_KW = 3.98;
export const REF_JANTA_WINTER_PEAK_KW = 4.6;

/** Summer daylight window — aligned with dashboard charts (ends 8 PM) */
export const JANTA_SUMMER_HOUR_MIN = 7;
export const JANTA_SUMMER_HOUR_MAX = 20;

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
  hourMin = JANTA_SUMMER_HOUR_MIN,
  hourMax = JANTA_SUMMER_HOUR_MAX,
  peakKw: number = REF_TRAD_SUMMER_PEAK_KW
): string {
  const peakHour = hourMin + (hourMax - hourMin) * 0.5;
  return bellCurvePath(geom, hourMin, hourMax, peakHour, peakKw);
}

/**
 * Summer Janta — same profile as the dashboard power chart:
 * mirrored 2h ramps, flat shoulders, centered midday saddle, ends at 8 PM.
 */
export function jantaSummerPath(
  geom: ChartGeom,
  hourMin = JANTA_SUMMER_HOUR_MIN,
  hourMax = JANTA_SUMMER_HOUR_MAX,
  peakKw: number = REF_JANTA_SUMMER_PEAK_KW,
  troughKw: number = REF_JANTA_SUMMER_TROUGH_KW
): string {
  const steps = 56;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const hour = hourMin + ((hourMax - hourMin) * i) / steps;
    const kw = jantaSummerKw(hour, hourMin, hourMax, peakKw, troughKw);
    parts.push(
      `${i === 0 ? "M" : "L"} ${fmt(geom.x(hour))} ${fmt(geom.y(kw))}`,
    );
  }
  return parts.join(" ");
}

/**
 * Winter Janta — plateau across daylight with rounded shoulders.
 * Sampled from jantaWinterKw so the drawn line always matches the hover readout.
 */
export function jantaWinterPath(
  geom: ChartGeom,
  hourMin = 7,
  hourMax = 21,
  peakKw: number = REF_JANTA_WINTER_PEAK_KW
): string {
  const steps = 64;
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

/** kW at hour — summer Janta (matches dashboard jantaPowerFactor shape) */
export function jantaSummerKw(
  hour: number,
  hourMin = JANTA_SUMMER_HOUR_MIN,
  hourMax = JANTA_SUMMER_HOUR_MAX,
  peakKw: number = REF_JANTA_SUMMER_PEAK_KW,
  troughKw: number = REF_JANTA_SUMMER_TROUGH_KW,
): number {
  if (hour <= hourMin || hour >= hourMax) return 0;

  const rampH = 2;
  const riseEnd = hourMin + rampH;
  const fallStart = hourMax - rampH;
  const dip = Math.max(0, Math.min(1, 1 - troughKw / Math.max(peakKw, 0.001)));

  let factor: number;
  if (hour < riseEnd) {
    const p = (hour - hourMin) / rampH;
    factor = 1 - (1 - p) ** 2.2;
  } else if (hour > fallStart) {
    const p = (hourMax - hour) / rampH;
    factor = 1 - (1 - p) ** 2.2;
  } else {
    const dipStart = hourMin + 3;
    const dipEnd = hourMax - 3;
    const mid = (hourMin + hourMax) / 2;
    if (hour >= dipStart && hour <= dipEnd) {
      const half = (dipEnd - dipStart) / 2;
      const x = Math.max(-1, Math.min(1, (hour - mid) / half));
      factor = 1 - dip * (0.5 + 0.5 * Math.cos(x * Math.PI));
    } else {
      factor = 1;
    }
  }

  return peakKw * factor;
}

/** kW at hour — winter Janta plateau with rounded (eased) shoulders */
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
  if (hour <= riseEnd) {
    return peakKw * smoothstep((hour - hourMin) / (riseEnd - hourMin));
  }
  if (hour <= plateauEnd) return peakKw;
  return peakKw * smoothstep((hourMax - hour) / (hourMax - plateauEnd));
}
