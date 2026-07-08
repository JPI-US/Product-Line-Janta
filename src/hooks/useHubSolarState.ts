import { useEffect, useState } from "react";
import { useHubPreview } from "../context/HubPreviewContext";
import { resolveHubCoords } from "../lib/hubWeatherFetch";
import type { HubSolarCoords } from "../lib/hubSolarSample";

/** GPS/IP coords for solar math — resolved once, not tied to weather preview. */
export function useHubSolarCoords(enabled = true): HubSolarCoords | null {
  const [coords, setCoords] = useState<HubSolarCoords | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    void resolveHubCoords().then((resolved) => {
      if (!cancelled) setCoords({ lat: resolved.lat, lon: resolved.lon });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return coords;
}

/** Live clock for the status bar only — does not drive tower rotation. */
export function useHubLiveClock(): Date {
  const { previewDate } = useHubPreview();
  const [liveNow, setLiveNow] = useState(() => new Date());

  useEffect(() => {
    if (previewDate) return;
    const id = window.setInterval(() => setLiveNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [previewDate?.getTime()]);

  return previewDate ?? liveNow;
}
