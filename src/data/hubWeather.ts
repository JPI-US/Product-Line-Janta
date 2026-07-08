/** Local weather mood for the hub sky */
export type HubWeatherKind =
  | "clear"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm";

const HUB_WEATHER_KINDS: HubWeatherKind[] = [
  "clear",
  "cloudy",
  "fog",
  "drizzle",
  "rain",
  "snow",
  "storm",
];

export function isHubWeatherKind(value: string): value is HubWeatherKind {
  return (HUB_WEATHER_KINDS as string[]).includes(value);
}

const WEATHER_LABELS: Record<HubWeatherKind, string> = {
  clear: "Clear",
  cloudy: "Cloudy",
  fog: "Fog",
  drizzle: "Drizzle",
  rain: "Rain",
  snow: "Snow",
  storm: "Thunderstorms",
};

export function weatherKindLabel(kind: HubWeatherKind): string {
  return WEATHER_LABELS[kind];
}

export function isPrecipitationKind(kind: HubWeatherKind): boolean {
  return (
    kind === "drizzle" ||
    kind === "rain" ||
    kind === "snow" ||
    kind === "storm"
  );
}

export function weatherKindFromWmo(code: number): HubWeatherKind {
  if (code === 0) return "clear";
  if (code === 1 || code === 2 || code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "rain";
  if (code >= 85 && code <= 86) return "snow";
  if (code >= 95) return "storm";
  return "clear";
}

/** Only upgrade to rain when measured precipitation is meaningful (not forecast noise) */
export function applyPrecipitationBoost(
  kind: HubWeatherKind,
  precipMm: number
): HubWeatherKind {
  if (kind === "snow" || kind === "storm") return kind;
  if (precipMm >= 3) return "storm";
  if (precipMm >= 0.5) return kind === "drizzle" ? "drizzle" : "rain";
  return kind;
}

export function kindFromNwsText(text: string): HubWeatherKind | null {
  const t = text.toLowerCase();
  if (/thunder|tornado|hail/.test(t)) return "storm";
  if (/heavy rain|pouring|(?:^|\s)rain(?:\s|$)|drizzle|sprinkle/.test(t)) {
    return /drizzle|sprinkle/.test(t) ? "drizzle" : "rain";
  }
  if (/\bshower/.test(t) && !/chance/.test(t)) return "rain";
  if (/snow|sleet|flurr|blizzard|wintry/.test(t)) return "snow";
  if (/fog|mist|haze/.test(t)) return "fog";
  if (/cloud|overcast/.test(t)) return "cloudy";
  if (/clear|sunny|fair|partly/.test(t)) return "clear";
  return null;
}

export function kindFromNwsIcon(iconUrl: string): HubWeatherKind | null {
  const u = iconUrl.toLowerCase();
  if (/\/tsra|\/hurricane|\/tornado|\/hail/.test(u)) return "storm";
  if (/\/snow|\/blizzard|\/fzra|\/sleet|\/ip/.test(u)) return "snow";
  if (/\/rain|\/shra|\/hi_shwrs|\/ra\b|\/dz/.test(u)) return "rain";
  if (/\/fog|\/mist|\/haze/.test(u)) return "fog";
  if (/\/ovc|\/bkn/.test(u)) return "cloudy";
  if (/\/few|\/sct|\/skc|\/wind/.test(u)) return "clear";
  return null;
}

export function mergeWeatherKinds(
  ...kinds: (HubWeatherKind | null | undefined)[]
): HubWeatherKind {
  const priority: HubWeatherKind[] = [
    "storm",
    "rain",
    "snow",
    "drizzle",
    "fog",
    "cloudy",
    "clear",
  ];
  for (const p of priority) {
    if (kinds.some((k) => k === p)) return p;
  }
  return "clear";
}

export function hasPrecipitationEffect(kind: HubWeatherKind): boolean {
  return isPrecipitationKind(kind);
}

/** Rain/snow canvas + sky tint — drizzle and storm map to rain */
export function hasWeatherVisualEffect(kind: HubWeatherKind): boolean {
  return (
    kind === "rain" ||
    kind === "snow" ||
    kind === "storm" ||
    kind === "drizzle"
  );
}

export function weatherKindForVisualEffect(
  kind: HubWeatherKind
): "rain" | "snow" | null {
  if (kind === "snow") return "snow";
  if (
    kind === "rain" ||
    kind === "drizzle" ||
    kind === "storm"
  ) {
    return "rain";
  }
  return null;
}

export function intensityFromPrecip(
  kind: HubWeatherKind,
  precipMm: number
): number {
  const effect = weatherKindForVisualEffect(kind);
  if (!effect) return 0;
  if (effect === "rain") {
    const heavy = kind === "storm";
    return Math.min(
      0.82,
      Math.max(heavy ? 0.5 : 0.4, 0.32 + precipMm * 0.08)
    );
  }
  return Math.min(0.72, Math.max(0.38, 0.35 + precipMm * 0.08));
}
