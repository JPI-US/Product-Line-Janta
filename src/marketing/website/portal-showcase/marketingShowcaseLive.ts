import { GENERIC_SOLAR_KW } from "./marketingSystem";

export type ShowcaseLiveSnapshot = {
  pvPowerKw: number;
  powerPercent: number;
  towerAngle: number;
  weatherCondition: string;
  highlightHour: number;
};

const TICK_MIN_MS = 3_000;
const TICK_MAX_MS = 5_000;

const TOWER_ANGLES = [92, 118, 142.5, 158, 187, 212, 248, 271] as const;

const WEATHER_CONDITIONS = [
  "Sunny",
  "Clear",
  "Mostly Sunny",
  "Partly Sunny",
  "Partly Cloudy",
  "Mostly Cloudy",
  "Cloudy",
] as const;

function pickItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function roundKw(value: number) {
  return Math.round(value * 100) / 100;
}

export function nextShowcaseIntervalMs() {
  return TICK_MIN_MS + Math.random() * (TICK_MAX_MS - TICK_MIN_MS);
}

export function pickShowcaseSnapshot(powerByHour: number[]): ShowcaseLiveSnapshot {
  const poweredHours = powerByHour
    .map((kw, hour) => (kw > 0.15 ? hour : -1))
    .filter((hour) => hour >= 0);

  const highlightHour =
    poweredHours.length > 0 ? pickItem(poweredHours) : 12 + Math.floor(Math.random() * 7);

  const pvPowerKw = roundKw(powerByHour[highlightHour] ?? 0);
  const powerPercent = Math.min(Math.max(pvPowerKw / GENERIC_SOLAR_KW, 0), 1);

  return {
    pvPowerKw,
    powerPercent,
    towerAngle: pickItem(TOWER_ANGLES),
    weatherCondition: pickItem(WEATHER_CONDITIONS),
    highlightHour,
  };
}
