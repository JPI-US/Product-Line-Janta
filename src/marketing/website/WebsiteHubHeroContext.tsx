import { createContext, useContext, type ReactNode } from "react";
import type { HubSolarCoords } from "../../lib/hubSolarSample";
import type { HubWeatherResult } from "../../lib/hubWeatherFetch";
import { WEBSITE_HERO_WEATHER } from "./websiteHeroWeather";

type WebsiteHubHeroContextValue = {
  weather: HubWeatherResult;
  coords: HubSolarCoords | null;
};

const WebsiteHubHeroContext = createContext<WebsiteHubHeroContextValue | null>(
  null,
);

const websiteHeroValue: WebsiteHubHeroContextValue = {
  weather: WEBSITE_HERO_WEATHER,
  coords: null,
};

export function WebsiteHubHeroProvider({ children }: { children: ReactNode }) {
  return (
    <WebsiteHubHeroContext.Provider value={websiteHeroValue}>
      {children}
    </WebsiteHubHeroContext.Provider>
  );
}

export function useWebsiteHubHero() {
  const ctx = useContext(WebsiteHubHeroContext);
  if (!ctx) {
    throw new Error("useWebsiteHubHero must be used within WebsiteHubHeroProvider");
  }
  return ctx;
}
