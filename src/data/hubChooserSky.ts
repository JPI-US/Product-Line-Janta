export type ChooserSkyStops = {
  zenith: string;
  mid: string;
  horizon: string;
};

export type SkyPeriod = "night" | "dawn" | "day" | "golden" | "dusk";

export const SKY_PERIOD_LABELS: Record<SkyPeriod, string> = {
  night: "Night",
  dawn: "Dawn",
  day: "Day",
  golden: "Golden hour",
  dusk: "Dusk",
};

export function getSkyPeriodLabel(period: SkyPeriod): string {
  return SKY_PERIOD_LABELS[period];
}

function lerpChannel(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function lerpHex(hexA: string, hexB: string, t: number): string {
  const parse = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
  };
  const [ar, ag, ab] = parse(hexA);
  const [br, bg, bb] = parse(hexB);
  return `#${(
    (1 << 24) +
    (lerpChannel(ar, br, t) << 16) +
    (lerpChannel(ag, bg, t) << 8) +
    lerpChannel(ab, bb, t)
  )
    .toString(16)
    .slice(1)}`;
}

function lerpStops(a: ChooserSkyStops, b: ChooserSkyStops, t: number): ChooserSkyStops {
  return {
    zenith: lerpHex(a.zenith, b.zenith, t),
    mid: lerpHex(a.mid, b.mid, t),
    horizon: lerpHex(a.horizon, b.horizon, t),
  };
}

function mixTowardWhite(hex: string, amount: number): string {
  return lerpHex(hex, "#ffffff", amount);
}

function mixTowardBlack(hex: string, amount: number): string {
  return lerpHex(hex, "#000000", amount);
}

/** Sky palette keyed to time of day (local) — vivid, non-monochrome gradients. */
const SKY: Record<SkyPeriod, ChooserSkyStops> = {
  night: {
    zenith: "#060818",
    mid: "#141238",
    horizon: "#3a2858",
  },
  dawn: {
    zenith: "#2e3a7a",
    mid: "#e8a8d0",
    horizon: "#ffd8b0",
  },
  day: {
    zenith: "#2e6eb5",
    mid: "#5a9fd4",
    horizon: "#9fd0ef",
  },
  golden: {
    zenith: "#5a4878",
    mid: "#d88848",
    horizon: "#f5c868",
  },
  dusk: {
    zenith: "#0e0828",
    mid: "#902858",
    horizon: "#ff5030",
  },
};

/** Minutes since midnight → stops along a full day cycle. */
const DAY_TIMELINE: { minutes: number; period: SkyPeriod; stops: ChooserSkyStops }[] =
  [
    { minutes: 0, period: "night", stops: SKY.night },
    { minutes: 5 * 60, period: "night", stops: SKY.night },
    { minutes: 5.5 * 60, period: "night", stops: SKY.night },
    { minutes: 6 * 60, period: "dawn", stops: SKY.dawn },
    { minutes: 7.5 * 60, period: "dawn", stops: SKY.dawn },
    { minutes: 9 * 60, period: "day", stops: SKY.day },
    { minutes: 16 * 60, period: "day", stops: SKY.day },
    { minutes: 17 * 60, period: "golden", stops: SKY.golden },
    { minutes: 18.5 * 60, period: "golden", stops: SKY.golden },
    { minutes: 19.5 * 60, period: "dusk", stops: SKY.dusk },
    { minutes: 21 * 60, period: "dusk", stops: SKY.dusk },
    { minutes: 22 * 60, period: "night", stops: SKY.night },
    { minutes: 24 * 60, period: "night", stops: SKY.night },
  ];

/** Subtle in-period pulse — keeps core hues, adds life. */
const SKY_BREATH: Record<SkyPeriod, { lighten: number; darken: number; cycleMs: number }> =
  {
    night: { lighten: 0.05, darken: 0.06, cycleMs: 20_000 },
    dawn: { lighten: 0.08, darken: 0.06, cycleMs: 8_500 },
    day: { lighten: 0.03, darken: 0.04, cycleMs: 16_000 },
    golden: { lighten: 0.09, darken: 0.05, cycleMs: 7_500 },
    dusk: { lighten: 0.08, darken: 0.07, cycleMs: 8_000 },
  };

function getTimelineSegment(date: Date) {
  const minutes = date.getHours() * 60 + date.getMinutes();

  for (let i = 0; i < DAY_TIMELINE.length - 1; i++) {
    const a = DAY_TIMELINE[i];
    const b = DAY_TIMELINE[i + 1];
    if (minutes >= a.minutes && minutes <= b.minutes) {
      const span = b.minutes - a.minutes;
      const t = span > 0 ? (minutes - a.minutes) / span : 0;
      return { a, b, t };
    }
  }

  return null;
}

export function getChooserSkyStopsForDate(date = new Date()): ChooserSkyStops {
  const seg = getTimelineSegment(date);
  if (!seg) return SKY.day;
  return lerpStops(seg.a.stops, seg.b.stops, seg.t);
}

export function getChooserSkyPeriodForDate(date = new Date()): SkyPeriod {
  const seg = getTimelineSegment(date);
  if (!seg) return "day";
  return seg.t < 0.5 ? seg.a.period : seg.b.period;
}

export function getSkyStopsForPeriod(period: SkyPeriod): ChooserSkyStops {
  return SKY[period];
}

/** Gentle oscillation around the period's base stops (same core colors). */
export function getBreathingSkyStops(
  base: ChooserSkyStops,
  period: SkyPeriod,
  nowMs = performance.now()
): ChooserSkyStops {
  const { lighten, darken, cycleMs } = SKY_BREATH[period];
  const wave = (Math.sin((nowMs / cycleMs) * Math.PI * 2) + 1) / 2;

  const lighter: ChooserSkyStops = {
    zenith: mixTowardWhite(base.zenith, lighten),
    mid: mixTowardWhite(base.mid, lighten),
    horizon: mixTowardWhite(base.horizon, lighten),
  };
  const darker: ChooserSkyStops = {
    zenith: mixTowardBlack(base.zenith, darken),
    mid: mixTowardBlack(base.mid, darken),
    horizon: mixTowardBlack(base.horizon, darken),
  };

  return lerpStops(darker, lighter, wave);
}

export function chooserSkyStopsToCss(stops: ChooserSkyStops): string {
  return `linear-gradient(180deg, ${stops.zenith} 0%, ${stops.mid} 48%, ${stops.horizon} 100%)`;
}

export function getChooserSkyCssForDate(date = new Date()): string {
  return chooserSkyStopsToCss(getChooserSkyStopsForDate(date));
}

export function applyChooserSkyToElement(
  el: HTMLElement,
  stops: ChooserSkyStops = getChooserSkyStopsForDate()
) {
  el.style.setProperty("--hub-zenith", stops.zenith);
  el.style.setProperty("--hub-mid", stops.mid);
  el.style.setProperty("--hub-horizon", stops.horizon);
}
