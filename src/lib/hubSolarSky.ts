import type { SkyPeriod } from "../data/hubChooserSky";
import {
  weatherKindForVisualEffect,
  type HubWeatherKind,
} from "../data/hubWeather";
import type { LivingSkyFrame } from "../data/hubLivingSky";
import type { HubTowerLayout } from "../components/three/hubTowerConfig";
import {
  getViewportAspect,
  projectSunToHubSky,
} from "./hubSolarAlignment";

const PERIOD_CORE: Record<SkyPeriod, string> = {
  night: "transparent",
  dawn: "rgba(255, 230, 200, 0.92)",
  day: "rgba(255, 252, 245, 0.95)",
  golden: "rgba(255, 210, 140, 0.96)",
  dusk: "rgba(255, 160, 120, 0.95)",
};

const PERIOD_GLOW: Record<SkyPeriod, number> = {
  night: 0.12,
  dawn: 0.88,
  day: 0.62,
  golden: 0.98,
  dusk: 0.86,
};

const WEATHER_SUN: Record<HubWeatherKind, number> = {
  clear: 1,
  cloudy: 0.5,
  fog: 0.22,
  drizzle: 0.16,
  rain: 0.1,
  storm: 0.06,
  snow: 0.38,
};

export function getHubSkySunFromSolar(
  azimuthDeg: number,
  altitudeDeg: number,
  period: SkyPeriod,
  viewportAspect = getViewportAspect(),
  layout?: HubTowerLayout
): Pick<LivingSkyFrame, "sunX" | "sunY" | "sunGlow" | "sunCore"> {
  const projected = projectSunToHubSky(
    azimuthDeg,
    altitudeDeg,
    viewportAspect,
    layout
  );

  const rise = Math.min(1, Math.max(0, (altitudeDeg + 4) / 14));
  const glow = rise * PERIOD_GLOW[period] * projected.glowMul;

  return {
    sunX: projected.sunX,
    sunY: projected.sunY,
    sunGlow: glow.toFixed(3),
    sunCore:
      !projected.visible || altitudeDeg < 0
        ? "transparent"
        : PERIOD_CORE[period],
  };
}

export function applySolarSunToLivingSky(
  frame: LivingSkyFrame,
  azimuthDeg: number,
  altitudeDeg: number,
  period: SkyPeriod,
  weatherKind: HubWeatherKind,
  intensity: number,
  viewportAspect = getViewportAspect(),
  layout?: HubTowerLayout
): LivingSkyFrame {
  const solar = getHubSkySunFromSolar(
    azimuthDeg,
    altitudeDeg,
    period,
    viewportAspect,
    layout
  );
  const effect = weatherKindForVisualEffect(weatherKind);
  const weatherMul = effect
    ? WEATHER_SUN[effect] * (1 - intensity * 0.32)
    : 1;
  const glow = Math.max(0, parseFloat(solar.sunGlow) * weatherMul);

  return {
    ...frame,
    sunX: solar.sunX,
    sunY: solar.sunY,
    sunGlow: glow.toFixed(3),
    sunCore: effect === "rain" ? "transparent" : solar.sunCore,
  };
}
