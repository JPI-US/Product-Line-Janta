import type { CSSProperties } from "react";
import { weatherKindForVisualEffect } from "../data/hubWeather";
import type { HubWeatherResult } from "../lib/hubWeatherFetch";
import { HubWeatherCanvas } from "./HubWeatherCanvas";

type HubWeatherLayerProps = {
  weather: HubWeatherResult;
};

/** Rain/snow overlays — sits above the hub tower, below the chooser UI. */
export function HubWeatherLayer({ weather }: HubWeatherLayerProps) {
  const { kind: weatherKind, intensity } = weather;
  const effectKind = weatherKindForVisualEffect(weatherKind);

  return (
    <div
      className="hub__weather"
      data-hub-weather={effectKind ?? "clear"}
      style={
        {
          "--hub-weather-intensity": effectKind ? intensity : 0,
        } as CSSProperties
      }
      aria-hidden
    >
      <div className="hub__sky-weather-mist" aria-hidden />
      <div className="hub__sky-weather-dim" aria-hidden />
      {effectKind ? (
        <>
          <div
            className={`hub__sky-weather-atmosphere hub__sky-weather-atmosphere--${effectKind}`}
            aria-hidden
          />
          <HubWeatherCanvas kind={effectKind} intensity={intensity} />
        </>
      ) : null}
    </div>
  );
}
