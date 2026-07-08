import {
  getChooserSkyPeriodForDate,
  getChooserSkyStopsForDate,
  getSkyStopsForPeriod,
  type SkyPeriod,
} from "./hubChooserSky";
export type LivingSkyFrame = {
  zenith: string;
  mid: string;
  horizon: string;
  sunX: string;
  sunY: string;
  sunGlow: string;
  sunCore: string;
  cloudAX: string;
  cloudAY: string;
  cloudBX: string;
  cloudBY: string;
  auroraRotate: string;
  auroraShift: string;
  flowX: string;
  flowY: string;
  flowRotate: string;
  flowScale: string;
  morphHue: string;
  morphSkew: string;
  hazeY: string;
  hazeOpacity: string;
  starOpacity: string;
  vignette: string;
};

const PERIOD_MOTION: Record<
  SkyPeriod,
  { sunPath: [number, number, number, number]; cloudSpeed: number }
> = {
  night: { sunPath: [0.5, -0.2, 0.5, -0.2], cloudSpeed: 0.000014 },
  dawn: { sunPath: [0.1, 0.8, 0.35, 0.52], cloudSpeed: 0.000024 },
  day: { sunPath: [0.22, 0.39, 0.78, 0.36], cloudSpeed: 0.000018 },
  golden: { sunPath: [0.75, 0.46, 0.9, 0.6], cloudSpeed: 0.000026 },
  dusk: { sunPath: [0.85, 0.65, 0.53, 0.75], cloudSpeed: 0.000028 },
};

const FLOW_MOTION: Record<
  SkyPeriod,
  { ampX: number; ampY: number; rot: number; speed: number }
> = {
  night: { ampX: 8, ampY: 6, rot: 5, speed: 0.06 },
  dawn: { ampX: 14, ampY: 11, rot: 9, speed: 0.09 },
  day: { ampX: 10, ampY: 8, rot: 6, speed: 0.07 },
  golden: { ampX: 16, ampY: 12, rot: 10, speed: 0.1 },
  dusk: { ampX: 15, ampY: 13, rot: 11, speed: 0.095 },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function sunPosition(period: SkyPeriod, t: number): { x: number; y: number; glow: number } {
  const [x0, y0, x1, y1] = PERIOD_MOTION[period].sunPath;
  const wave = (Math.sin(t * Math.PI * 2) + 1) / 2;
  const x = lerp(x0, x1, wave);
  const y = lerp(y0, y1, 0.5 + Math.sin(t * Math.PI * 4) * 0.08);

  const glowByPeriod: Record<SkyPeriod, number> = {
    night: 0.12,
    dawn: 0.82,
    day: 0.55,
    golden: 0.95,
    dusk: 0.88,
  };

  return { x, y, glow: glowByPeriod[period] };
}

export type LivingSkyPreview = {
  at?: Date;
  period?: SkyPeriod;
};

export function getLivingSkyFrame(
  date = new Date(),
  nowMs = performance.now(),
  preview?: LivingSkyPreview
): LivingSkyFrame {
  const at = preview?.at ?? date;
  const forcedPeriod = preview?.period;
  const period = forcedPeriod ?? getChooserSkyPeriodForDate(at);
  const base = forcedPeriod
    ? getSkyStopsForPeriod(forcedPeriod)
    : getChooserSkyStopsForDate(at);
  const stops = base;
  const t = nowMs * 0.001;
  const motionT = t * 0.35;
  const sun = sunPosition(period, t * 0.04);
  const speed = PERIOD_MOTION[period].cloudSpeed;

  const cloudAX = `${Math.sin(motionT * speed * 900) * 6}%`;
  const cloudAY = `${Math.cos(motionT * speed * 700) * 2.5}%`;
  const cloudBX = `${Math.cos(motionT * speed * 820 + 1.2) * 8}%`;
  const cloudBY = `${Math.sin(motionT * speed * 640 + 0.8) * 3}%`;

  const starOpacity =
    period === "night"
      ? "0.52"
      : period === "dawn" || period === "dusk"
        ? "0.06"
        : period === "golden"
          ? "0.04"
          : "0";

  const hazeOpacity: Record<SkyPeriod, number> = {
    night: 0.22,
    dawn: 0.32,
    day: 0.2,
    golden: 0.34,
    dusk: 0.3,
  };

  return {
    zenith: stops.zenith,
    mid: stops.mid,
    horizon: stops.horizon,
    sunX: `${sun.x * 100}%`,
    sunY: `${sun.y * 100}%`,
    sunGlow: "0",
    sunCore:
      period === "night"
        ? "transparent"
        : period === "golden"
          ? "rgba(255, 210, 140, 0.95)"
          : period === "dusk"
            ? "rgba(255, 160, 120, 0.95)"
            : period === "dawn"
              ? "rgba(255, 230, 200, 0.92)"
              : "rgba(255, 252, 245, 0.9)",
    cloudAX,
    cloudAY,
    cloudBX,
    cloudBY,
    auroraRotate: `${Math.sin(motionT * 0.05) * 4 + Math.cos(motionT * 0.03) * 2.5}deg`,
    auroraShift: `${Math.sin(motionT * 0.06) * 5 + Math.cos(motionT * 0.04) * 3}%`,
    flowX: `${Math.sin(motionT * FLOW_MOTION[period].speed) * FLOW_MOTION[period].ampX + Math.cos(motionT * FLOW_MOTION[period].speed * 1.3) * (FLOW_MOTION[period].ampX * 0.4)}%`,
    flowY: `${Math.cos(motionT * FLOW_MOTION[period].speed * 1.1) * FLOW_MOTION[period].ampY + Math.sin(motionT * FLOW_MOTION[period].speed * 0.85) * (FLOW_MOTION[period].ampY * 0.35)}%`,
    flowRotate: `${Math.sin(motionT * 0.04) * FLOW_MOTION[period].rot * 0.7}deg`,
    flowScale: `${1 + Math.sin(motionT * 0.07) * 0.04}`,
    morphHue: "0deg",
    morphSkew: "0deg",
    hazeY: "4%",
    hazeOpacity: String(hazeOpacity[period]),
    starOpacity,
    vignette:
      period === "night"
        ? "0.38"
        : period === "day"
          ? "0.1"
          : period === "golden" || period === "dusk"
            ? "0.2"
            : "0.18",
  };
}

export function applyLivingSkyFrame(el: HTMLElement, frame: LivingSkyFrame) {
  el.style.setProperty("--hub-zenith", frame.zenith);
  el.style.setProperty("--hub-mid", frame.mid);
  el.style.setProperty("--hub-horizon", frame.horizon);
  el.style.setProperty("--hub-sun-x", frame.sunX);
  el.style.setProperty("--hub-sun-y", frame.sunY);
  el.style.setProperty("--hub-sun-glow", frame.sunGlow);
  el.style.setProperty("--hub-sun-core", frame.sunCore);
  el.style.setProperty("--hub-cloud-a-x", frame.cloudAX);
  el.style.setProperty("--hub-cloud-a-y", frame.cloudAY);
  el.style.setProperty("--hub-cloud-b-x", frame.cloudBX);
  el.style.setProperty("--hub-cloud-b-y", frame.cloudBY);
  el.style.setProperty("--hub-aurora-rotate", frame.auroraRotate);
  el.style.setProperty("--hub-aurora-shift", frame.auroraShift);
  el.style.setProperty("--hub-flow-x", frame.flowX);
  el.style.setProperty("--hub-flow-y", frame.flowY);
  el.style.setProperty("--hub-flow-rotate", frame.flowRotate);
  el.style.setProperty("--hub-flow-scale", frame.flowScale);
  el.style.setProperty("--hub-morph-hue", frame.morphHue);
  el.style.setProperty("--hub-morph-skew", frame.morphSkew);
  el.style.setProperty("--hub-haze-y", frame.hazeY);
  el.style.setProperty("--hub-haze-opacity", frame.hazeOpacity);
  el.style.setProperty("--hub-star-opacity", frame.starOpacity);
  el.style.setProperty("--hub-vignette", frame.vignette);
}
