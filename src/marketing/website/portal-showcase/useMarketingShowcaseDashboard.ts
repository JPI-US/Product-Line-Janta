import { useEffect, useMemo, useState } from "react";
import {
  buildMarketingEnergyChartPoints,
  buildMarketingFroniusResponse,
  buildMarketingWeather,
  type MarketingWeather,
} from "./marketingMockData";
import { hourlyPowerKwByHour, productionHourRange } from "./marketingDashboardUtils";
import { GENERIC_SOLAR_KW, MARKETING_SYSTEM } from "./marketingSystem";
import {
  nextShowcaseIntervalMs,
  pickShowcaseSnapshot,
  type ShowcaseLiveSnapshot,
} from "./marketingShowcaseLive";

const TZ = MARKETING_SYSTEM.timezone;

/** Marketing tablet showcase — static charts, cycling live status metrics. */
export function useMarketingShowcaseDashboard(active: boolean) {
  const fronius = useMemo(() => buildMarketingFroniusResponse(TZ), []);
  const baseWeather = useMemo(() => buildMarketingWeather(TZ), []);

  const hourlyProduction = fronius.data.hourlyproduction;

  const hourRange = useMemo(
    () => productionHourRange(hourlyProduction.labels, hourlyProduction.values),
    [hourlyProduction],
  );

  const energyChartPoints = useMemo(
    () => buildMarketingEnergyChartPoints(hourRange.start, hourRange.end),
    [hourRange],
  );

  const powerByHour = useMemo(() => hourlyPowerKwByHour(hourlyProduction), [hourlyProduction]);

  const chartHours = useMemo(() => {
    const hours: number[] = [];
    for (let h = hourRange.start; h <= hourRange.end; h++) hours.push(h);
    return hours;
  }, [hourRange]);

  const [live, setLive] = useState<ShowcaseLiveSnapshot>(() => pickShowcaseSnapshot(powerByHour));

  useEffect(() => {
    if (!active) return;

    let timeout = 0;

    const schedule = () => {
      timeout = window.setTimeout(() => {
        setLive(pickShowcaseSnapshot(powerByHour));
        schedule();
      }, nextShowcaseIntervalMs());
    };

    schedule();
    return () => window.clearTimeout(timeout);
  }, [active, powerByHour]);

  const weather = useMemo<MarketingWeather>(
    () => ({
      ...baseWeather,
      current: {
        ...baseWeather.current,
        condition: live.weatherCondition,
      },
    }),
    [baseWeather, live.weatherCondition],
  );

  return {
    weather,
    pvPowerKw: live.pvPowerKw,
    powerPercent: live.powerPercent,
    energyChartPoints,
    chartHours,
    powerByHour,
    currentHour: live.highlightHour,
    towerAngle: live.towerAngle,
    maxPvKw: GENERIC_SOLAR_KW,
  };
}
