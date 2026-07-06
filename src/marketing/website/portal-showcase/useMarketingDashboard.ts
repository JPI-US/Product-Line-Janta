import { useEffect, useMemo, useState } from "react";
import {
  buildMarketingEnergyChartPoints,
  buildMarketingFroniusResponse,
  buildMarketingWeather,
} from "./marketingMockData";
import {
  avgPowerKw,
  hourlyPowerKwByHour,
  productionHourRange,
} from "./marketingDashboardUtils";
import { GENERIC_SOLAR_KW, MARKETING_SYSTEM, marketingSystemPayload } from "./marketingSystem";
import { getZonedParts } from "./zonedTime";

const TZ = MARKETING_SYSTEM.timezone;
const POLL_MS = 10_000;

export function useMarketingDashboard(active: boolean) {
  const system = useMemo(() => marketingSystemPayload(), []);

  const [fronius, setFronius] = useState(() => buildMarketingFroniusResponse(TZ));
  const [weather, setWeather] = useState(() => buildMarketingWeather(TZ));

  useEffect(() => {
    if (!active) return;

    const refresh = () => {
      setFronius(buildMarketingFroniusResponse(TZ));
      setWeather(buildMarketingWeather(TZ));
    };

    refresh();
    const id = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(id);
  }, [active]);

  const hourlyProduction = fronius.data.hourlyproduction;
  const pvPower = fronius.data.live.pvPower;
  const pvPowerKw = pvPower / 1000;
  const maxPvKw = GENERIC_SOLAR_KW;
  const powerPercent = Math.min(Math.max(pvPower / (maxPvKw * 1000), 0), 1);

  const hourRange = useMemo(
    () => productionHourRange(hourlyProduction.labels, hourlyProduction.values),
    [hourlyProduction],
  );

  const energyChartPoints = useMemo(
    () => buildMarketingEnergyChartPoints(hourRange.start, hourRange.end),
    [hourRange],
  );

  const powerByHour = useMemo(() => hourlyPowerKwByHour(hourlyProduction), [hourlyProduction]);

  const performanceChartMaxKw = useMemo(
    () => Math.max(...powerByHour, 0.001),
    [powerByHour],
  );

  const peakTodayKw = useMemo(
    () => Math.round(Math.max(performanceChartMaxKw, pvPowerKw) * 100) / 100,
    [performanceChartMaxKw, pvPowerKw],
  );

  const avgKw = useMemo(() => avgPowerKw(hourlyProduction), [hourlyProduction]);

  const chartHours = useMemo(() => {
    const hours: number[] = [];
    for (let h = hourRange.start; h <= hourRange.end; h++) hours.push(h);
    return hours;
  }, [hourRange]);

  const currentHour = useMemo(() => getZonedParts(new Date(), TZ).hour, [fronius, weather]);

  const towerAngle = system.towers[0]?.tower_angle ?? 142.5;

  return {
    system,
    weather,
    pvPowerKw,
    powerPercent,
    peakTodayKw,
    avgKw,
    energyChartPoints,
    chartHours,
    powerByHour,
    currentHour,
    towerAngle,
    maxPvKw,
  };
}
