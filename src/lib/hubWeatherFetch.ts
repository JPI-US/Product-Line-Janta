import {
  applyPrecipitationBoost,
  intensityFromPrecip,
  isPrecipitationKind,
  kindFromNwsIcon,
  kindFromNwsText,
  weatherKindFromWmo,
  type HubWeatherKind,
} from "../data/hubWeather";

const NWS_USER_AGENT = "Janta Power Product Line (hub weather; contact@jantapower.com)";
const REFRESH_MS = 5 * 60_000;

export type HubLocationSource = "gps" | "ip";

export type HubWeatherLocation = {
  lat: number;
  lon: number;
  source: HubLocationSource;
  label: string | null;
};

export type HubWeatherResult = {
  kind: HubWeatherKind;
  localized: boolean;
  cloudCover: number;
  intensity: number;
  location: HubWeatherLocation | null;
};

type Coords = { lat: number; lon: number };

function readGeolocation(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("geolocation unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }),
      reject,
      {
        enableHighAccuracy: true,
        timeout: 14_000,
        maximumAge: 2 * 60_000,
      }
    );
  });
}

async function readIpGeolocation(): Promise<Coords & { label: string | null }> {
  const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
  if (!res.ok) throw new Error("ip geolocation failed");
  const data = (await res.json()) as {
    latitude?: string | number;
    longitude?: string | number;
    city?: string;
    region?: string;
  };
  const lat = Number(data.latitude);
  const lon = Number(data.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("ip geolocation invalid");
  }
  const label = [data.city, data.region].filter(Boolean).join(", ") || null;
  return { lat, lon, label };
}

export type ResolvedHubCoords = Coords & {
  source: HubLocationSource;
  label: string | null;
};

export async function resolveHubCoords(): Promise<ResolvedHubCoords> {
  try {
    const pos = await readGeolocation();
    return { ...pos, source: "gps", label: null };
  } catch {
    const ip = await readIpGeolocation();
    return { lat: ip.lat, lon: ip.lon, source: "ip", label: ip.label };
  }
}

function indexForCurrentMinutelySlot(times: string[]): number {
  if (!times.length) return 0;
  const now = Date.now();
  let best = 0;
  let bestDelta = Infinity;
  for (let i = 0; i < times.length; i += 1) {
    const t = new Date(times[i]).getTime();
    if (Number.isNaN(t)) continue;
    const delta = Math.abs(now - t);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = i;
    }
  }
  return best;
}

function readMinutelyPrecip(data: {
  minutely_15?: { time?: string[]; precipitation?: number[] };
}): number {
  const times = data.minutely_15?.time ?? [];
  const precip = data.minutely_15?.precipitation ?? [];
  if (!times.length) return 0;

  const i = indexForCurrentMinutelySlot(times);
  return precip[i] ?? 0;
}

function isLikelyUs(coords: Coords): boolean {
  return (
    coords.lat >= 24 &&
    coords.lat <= 50 &&
    coords.lon >= -125 &&
    coords.lon <= -66
  );
}

type StationObservation = {
  kind: HubWeatherKind;
  precipMm: number;
  cloudCover: number;
  ageMinutes: number;
};

async function fetchNwsObservation(
  stationId: string,
  headers: Record<string, string>
): Promise<StationObservation | null> {
  const obsRes = await fetch(
    `https://api.weather.gov/stations/${stationId}/observations/latest`,
    { headers }
  );
  if (!obsRes.ok) return null;

  const obs = (await obsRes.json()) as {
    properties?: {
      timestamp?: string;
      textDescription?: string;
      icon?: string;
      cloudLayers?: { amount?: string }[];
      precipitationLastHour?: { value?: number | null };
    };
  };

  const props = obs.properties;
  if (!props?.timestamp) return null;

  const ageMinutes =
    (Date.now() - new Date(props.timestamp).getTime()) / 60_000;
  if (ageMinutes > 90) return null;

  const kinds: (HubWeatherKind | null)[] = [
    kindFromNwsText(props.textDescription ?? ""),
    props.icon ? kindFromNwsIcon(props.icon) : null,
  ];

  const precip1h = props.precipitationLastHour?.value ?? 0;
  if (precip1h >= 0.5) {
    kinds.push(precip1h >= 3 ? "storm" : "rain");
  }

  const layers = props.cloudLayers ?? [];
  const ovc = layers.filter((l) => /OVC|BKN/.test(l.amount ?? "")).length;
  const cloudCover = ovc > 0 ? Math.min(100, 40 + ovc * 25) : 15;

  const kind = kinds.find((k) => k != null) ?? "clear";

  return {
    kind,
    precipMm: precip1h,
    cloudCover,
    ageMinutes,
  };
}

async function fetchNwsContext(coords: Coords): Promise<{
  observation: StationObservation | null;
  placeLabel: string | null;
} | null> {
  if (!isLikelyUs(coords)) return null;

  const headers = {
    Accept: "application/geo+json",
    "User-Agent": NWS_USER_AGENT,
  };

  const pointsRes = await fetch(
    `https://api.weather.gov/points/${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`,
    { headers }
  );
  if (!pointsRes.ok) return null;

  const points = (await pointsRes.json()) as {
    properties?: {
      observationStations?: string;
      relativeLocation?: {
        properties?: { city?: string; state?: string };
      };
    };
  };

  const rel = points.properties?.relativeLocation?.properties;
  const placeLabel = rel
    ? [rel.city, rel.state].filter(Boolean).join(", ")
    : null;

  const stationsUrl = points.properties?.observationStations;
  if (!stationsUrl) return { observation: null, placeLabel };

  const stationsRes = await fetch(stationsUrl, { headers });
  if (!stationsRes.ok) return { observation: null, placeLabel };

  const stations = (await stationsRes.json()) as {
    features?: { properties?: { stationIdentifier?: string } }[];
  };

  const stationIds = (stations.features ?? [])
    .map((f) => f.properties?.stationIdentifier)
    .filter((id): id is string => Boolean(id))
    .slice(0, 3);

  const observations = await Promise.all(
    stationIds.map((id) => fetchNwsObservation(id, headers))
  );

  let best: StationObservation | null = null;
  for (const obs of observations) {
    if (!obs) continue;
    if (!best || obs.ageMinutes < best.ageMinutes) best = obs;
  }

  return { observation: best, placeLabel };
}

async function fetchOpenMeteoCurrent(coords: Coords): Promise<{
  currentCode: number;
  currentPrecipMm: number;
  minutelyPrecipMm: number;
  cloudCover: number;
}> {
  const params = new URLSearchParams({
    latitude: String(coords.lat),
    longitude: String(coords.lon),
    current: "weather_code,precipitation,rain,showers,cloud_cover",
    minutely_15: "precipitation",
    forecast_minutes: "15",
    timezone: "auto",
  });

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );
  if (!res.ok) throw new Error("open-meteo failed");

  const data = (await res.json()) as {
    current?: {
      weather_code?: number;
      precipitation?: number;
      rain?: number;
      showers?: number;
      cloud_cover?: number;
    };
    minutely_15?: { time?: string[]; precipitation?: number[] };
  };

  const currentPrecipMm =
    (data.current?.precipitation ?? 0) +
    (data.current?.rain ?? 0) +
    (data.current?.showers ?? 0);

  return {
    currentCode: data.current?.weather_code ?? 0,
    currentPrecipMm,
    minutelyPrecipMm: readMinutelyPrecip(data),
    cloudCover: data.current?.cloud_cover ?? 0,
  };
}

function buildResult(
  kind: HubWeatherKind,
  precipMm: number,
  cloudCover: number,
  coords: ResolvedHubCoords,
  placeLabel: string | null
): HubWeatherResult {
  return {
    kind,
    localized: true,
    cloudCover,
    intensity: intensityFromPrecip(kind, precipMm),
    location: {
      lat: coords.lat,
      lon: coords.lon,
      source: coords.source,
      label: placeLabel ?? coords.label,
    },
  };
}

export async function fetchHubWeather(
  coords: ResolvedHubCoords
): Promise<HubWeatherResult> {
  const [nws, openMeteo] = await Promise.all([
    fetchNwsContext(coords).catch(() => null),
    fetchOpenMeteoCurrent(coords).catch(() => null),
  ]);

  const placeLabel = nws?.placeLabel ?? coords.label;
  const obs = nws?.observation;
  const measuredPrecip = openMeteo
    ? Math.max(openMeteo.currentPrecipMm, openMeteo.minutelyPrecipMm)
    : 0;

  // Trust a fresh station report when it says it is dry right now
  if (obs && obs.ageMinutes <= 75 && obs.precipMm < 0.5) {
    if (!isPrecipitationKind(obs.kind)) {
      return buildResult(obs.kind, 0, obs.cloudCover, coords, placeLabel);
    }
  }

  // Station measured rain in the last hour
  if (obs && obs.precipMm >= 0.5) {
    const kind = applyPrecipitationBoost(
      isPrecipitationKind(obs.kind) ? obs.kind : "rain",
      obs.precipMm
    );
    return buildResult(
      kind,
      obs.precipMm,
      Math.max(obs.cloudCover, openMeteo?.cloudCover ?? 0),
      coords,
      placeLabel
    );
  }

  // Open-Meteo measured precipitation at this moment (not hourly forecast)
  if (measuredPrecip >= 0.5) {
    const codeKind = openMeteo
      ? weatherKindFromWmo(openMeteo.currentCode)
      : "rain";
    const kind = applyPrecipitationBoost(codeKind, measuredPrecip);
    return buildResult(
      kind,
      measuredPrecip,
      openMeteo?.cloudCover ?? 50,
      coords,
      placeLabel
    );
  }

  // Dry — use observation or current sky code
  const dryKind = obs?.kind ?? weatherKindFromWmo(openMeteo?.currentCode ?? 0);
  const cloudCover = Math.max(
    obs?.cloudCover ?? 0,
    openMeteo?.cloudCover ?? 0
  );

  return buildResult(
    dryKind === "rain" || dryKind === "storm" ? "cloudy" : dryKind,
    0,
    cloudCover,
    coords,
    placeLabel
  );
}

export { REFRESH_MS };
