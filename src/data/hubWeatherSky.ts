import type { ChooserSkyStops } from "./hubChooserSky";
import {
  weatherKindForVisualEffect,
  type HubWeatherKind,
} from "./hubWeather";
import type { LivingSkyFrame } from "./hubLivingSky";

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

/** Target sky colors per condition (blended onto time-of-day base) */
const WEATHER_SKY: Record<HubWeatherKind, ChooserSkyStops> = {
  clear: { zenith: "#4b7fa8", mid: "#6696bd", horizon: "#87adca" },
  cloudy: { zenith: "#4a5f75", mid: "#5f7388", horizon: "#73899c" },
  fog: { zenith: "#8a939c", mid: "#9aa3ab", horizon: "#b0b8bf" },
  drizzle: { zenith: "#4a5a6a", mid: "#5c6d7d", horizon: "#6e7f8f" },
  rain: { zenith: "#3a4a5c", mid: "#4a5a6c", horizon: "#5a6a7c" },
  storm: { zenith: "#2a3545", mid: "#3a4555", horizon: "#4a5565" },
  snow: { zenith: "#7a8a96", mid: "#8d9ca8", horizon: "#a8b4be" },
};

const BLEND: Record<HubWeatherKind, number> = {
  clear: 0.1,
  cloudy: 0.38,
  fog: 0.5,
  drizzle: 0.45,
  rain: 0.52,
  storm: 0.62,
  snow: 0.48,
};

const SUN_GLOW: Record<HubWeatherKind, number> = {
  clear: 1,
  cloudy: 0.45,
  fog: 0.2,
  drizzle: 0.15,
  rain: 0.08,
  storm: 0.05,
  snow: 0.35,
};

const HAZE: Record<HubWeatherKind, number> = {
  clear: 1,
  cloudy: 1.25,
  fog: 1.85,
  drizzle: 1.5,
  rain: 1.65,
  storm: 1.8,
  snow: 1.4,
};

const VIGNETTE_ADD: Record<HubWeatherKind, number> = {
  clear: 0,
  cloudy: 0.06,
  fog: 0.1,
  drizzle: 0.12,
  rain: 0.18,
  storm: 0.28,
  snow: 0.08,
};

export const CLOUD_OPACITY: Record<HubWeatherKind, number> = {
  clear: 0.42,
  cloudy: 0.78,
  fog: 0.55,
  drizzle: 0.72,
  rain: 0.88,
  storm: 0.95,
  snow: 0.5,
};

export const MIST_OPACITY: Record<HubWeatherKind, number> = {
  clear: 0,
  cloudy: 0.06,
  fog: 0.35,
  drizzle: 0.22,
  rain: 0.28,
  storm: 0.38,
  snow: 0.14,
};

export function applyWeatherToLivingSky(
  frame: LivingSkyFrame,
  kind: HubWeatherKind,
  cloudCover: number,
  intensity: number
): LivingSkyFrame {
  const effectKind = weatherKindForVisualEffect(kind);
  if (!effectKind) return frame;

  const target = WEATHER_SKY[effectKind];
  const cloudBoost = Math.min(0.2, (cloudCover / 100) * 0.2);
  const blend =
    Math.min(0.95, BLEND[effectKind] + cloudBoost) * (0.65 + intensity * 0.35);

  const zenith = lerpHex(frame.zenith, target.zenith, blend);
  const mid = lerpHex(frame.mid, target.mid, blend);
  const horizon = lerpHex(frame.horizon, target.horizon, blend);

  const sunGlow =
    parseFloat(frame.sunGlow) * SUN_GLOW[effectKind] * (1 - intensity * 0.35);
  const hazeOpacity =
    parseFloat(frame.hazeOpacity) * HAZE[effectKind] * (1 + intensity * 0.25);
  const vignette =
    parseFloat(frame.vignette) +
    VIGNETTE_ADD[effectKind] +
    intensity * 0.08;

  return {
    ...frame,
    zenith,
    mid,
    horizon,
    sunGlow: String(Math.max(0, sunGlow)),
    hazeOpacity: String(Math.min(0.55, hazeOpacity)),
    vignette: String(Math.min(0.62, vignette)),
    sunCore: effectKind === "rain" ? "transparent" : frame.sunCore,
  };
}

export function getWeatherOverlayOpacity(
  kind: HubWeatherKind,
  intensity: number
): { clouds: number; mist: number } {
  const effectKind = weatherKindForVisualEffect(kind);
  if (!effectKind) {
    return { clouds: 0.42, mist: 0 };
  }
  const baseCloud = CLOUD_OPACITY[effectKind];
  const baseMist = MIST_OPACITY[effectKind];
  return {
    clouds: Math.min(1, baseCloud + intensity * 0.12),
    mist: Math.min(0.85, baseMist + intensity * 0.2),
  };
}
