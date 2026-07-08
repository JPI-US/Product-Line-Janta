import { useEffect, useState } from "react";
import { intensityFromPrecip, type HubWeatherKind } from "../data/hubWeather";
import { useHubPreview } from "../context/HubPreviewContext";
import {
  fetchHubWeather,
  REFRESH_MS,
  resolveHubCoords,
  type HubWeatherResult,
} from "../lib/hubWeatherFetch";

const DEFAULT_STATE: HubWeatherResult = {
  kind: "clear",
  localized: false,
  cloudCover: 0,
  intensity: 0,
  location: null,
};

function previewWeatherState(kind: HubWeatherKind): HubWeatherResult {
  return {
    kind,
    localized: true,
    cloudCover: 65,
    intensity: intensityFromPrecip(kind, 4),
    location: null,
  };
}

export function useHubWeather(enabled = true): HubWeatherResult {
  const { weather: previewWeather } = useHubPreview();
  const [state, setState] = useState<HubWeatherResult>(() =>
    previewWeather ? previewWeatherState(previewWeather) : DEFAULT_STATE
  );

  useEffect(() => {
    if (!enabled) return;

    if (previewWeather) {
      setState((prev) => ({
        ...previewWeatherState(previewWeather),
        location: prev.location,
      }));
      return;
    }

    let cancelled = false;
    let refreshTimer = 0;

    const load = async () => {
      try {
        const coords = await resolveHubCoords();
        if (cancelled) return;
        const result = await fetchHubWeather(coords);
        if (!cancelled) setState(result);
      } catch {
        if (!cancelled) setState(DEFAULT_STATE);
      }
    };

    void load();
    refreshTimer = window.setInterval(() => void load(), REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [enabled, previewWeather]);

  return state;
}
