import type { HubWeatherResult } from "../../lib/hubWeatherFetch";

/** Static clear sky for marketing — no live weather fetch or effects */
export const WEBSITE_HERO_WEATHER: HubWeatherResult = {
  kind: "clear",
  localized: false,
  cloudCover: 0,
  intensity: 0,
  location: null,
};
