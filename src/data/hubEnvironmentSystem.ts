/**
 * Hub environment — sky time-of-day phases + live weather moods.
 *
 * Formerly composed on the / product-line hub page (removed). Still drives the
 * marketing hero via HubSkyBackground + useHubWeather. Reuse this map when wiring
 * weather/sky elsewhere.
 *
 * Sky phases (local time): night → dawn → day → golden → dusk
 *   - Palette + timeline: hubChooserSky.ts (getChooserSkyStopsForDate, getChooserSkyPeriodForDate)
 *   - CSS variables / motion: hubLivingSky.ts (buildLivingSkyFrame)
 *   - Intro montage blue→sunset: hubSky.ts (getHubSkyStops)
 *
 * Weather moods (NWS / Open-Meteo): clear | cloudy | fog | drizzle | rain | snow | storm
 *   - Classification + labels: hubWeather.ts
 *   - Sky tint + cloud/mist opacity: hubWeatherSky.ts (applyWeatherToLivingSky, getWeatherOverlayOpacity)
 *   - Live fetch + polling: useHubWeather.ts → lib/hubWeatherFetch.ts
 *
 * Visual stack
 *   - HubSkyBackground — gradient, sun disc, clouds, stars, aurora (website hero)
 *   - HubWeatherLayer + HubWeatherCanvas — rain/snow particles + mist dim (hub-only UI removed; components kept)
 *   - HubPreviewContext + HubPreviewControls — override time, sky period, or weather for review
 */

export type { SkyPeriod } from "./hubChooserSky";
export {
  SKY_PERIOD_LABELS,
  getChooserSkyPeriodForDate,
  getChooserSkyStopsForDate,
  getSkyPeriodLabel,
} from "./hubChooserSky";

export type { HubWeatherKind } from "./hubWeather";
export {
  applyPrecipitationBoost,
  intensityFromPrecip,
  isHubWeatherKind,
  weatherKindForVisualEffect,
  weatherKindLabel,
} from "./hubWeather";

export {
  applyWeatherToLivingSky,
  getWeatherOverlayOpacity,
} from "./hubWeatherSky";
export {
  applyLivingSkyFrame,
  getLivingSkyFrame,
  type LivingSkyFrame,
} from "./hubLivingSky";

/** All supported sky periods in chronological order (one local day). */
export const HUB_SKY_PHASES = [
  "night",
  "dawn",
  "day",
  "golden",
  "dusk",
] as const;

/** All supported weather moods (live + preview). */
export const HUB_WEATHER_PHASES = [
  "clear",
  "cloudy",
  "fog",
  "drizzle",
  "rain",
  "snow",
  "storm",
] as const;
