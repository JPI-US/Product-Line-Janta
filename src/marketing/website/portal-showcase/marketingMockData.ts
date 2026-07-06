import { GENERIC_SOLAR_KW, MARKETING_SYSTEM } from "./marketingSystem";
import { daysInMonth, getZonedParts, hourDecimal, minutesSinceMidnight } from "./zonedTime";

/** Peak kW — 90% of rated (matches 4.5 kW on a 5 kW axis in marketing materials). */
const PEAK_KW = GENERIC_SOLAR_KW * 0.9;

/** Midday dip depth: 4.0 kW / 4.5 kW on the reference summer chart. */
const JANTA_MIDDAY_DIP = 0.111;

function stableNoise(a: number, b = 0) {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return 0.98 + (x - Math.floor(x)) * 0.02;
}

function plateauNoise(h: number, m: number, factor: number) {
  if (factor >= 0.97) return 1;
  if (factor <= 0.02) return 1;
  return stableNoise(h, m);
}

/** Summer Janta Power profile — steep 7–8 / 21–22 ramps, flat plateaus, smooth midday saddle. */
export function jantaPowerFactor(hourDecimal: number) {
  const t = hourDecimal;
  if (t < 7 || t > 22) return 0;

  if (t < 8) {
    const p = (t - 7) / 1;
    return 1 - (1 - p) ** 2.5;
  }

  if (t > 21) {
    const p = (22 - t) / 1;
    return p ** 2.5;
  }

  if (t >= 10 && t <= 18) {
    const mid = 14.5;
    const half = 4.5;
    const x = Math.max(-1, Math.min(1, (t - mid) / half));
    return 1 - JANTA_MIDDAY_DIP * (0.5 + 0.5 * Math.cos(x * Math.PI));
  }

  return 1;
}

function buildIntradayProduction() {
  const labels: string[] = [];
  const values: number[] = [];
  const energyWh: number[] = [];

  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      const hourDec = h + m / 60;
      const factor = jantaPowerFactor(hourDec);
      const watts = PEAK_KW * 1000 * factor;
      const wh = watts * (5 / 60);
      labels.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      values.push(Math.round(watts));
      energyWh.push(wh);
    }
  }

  return { labels, values, energyWh };
}

export type EnergyChartPoint = { hour: number; y: number };

/** Smooth energy-curve samples for the glance chart (hourly kWh from analytical profile). */
export function buildMarketingEnergyChartPoints(padStart = 5, padEnd = 23): EnergyChartPoint[] {
  const points: EnergyChartPoint[] = [];
  const from = Math.max(0, Math.min(23, padStart));
  const to = Math.max(0, Math.min(23, padEnd));

  for (let h = from; h <= to; h++) {
    let kwh = 0;
    for (let m = 0; m < 60; m += 5) {
      kwh += PEAK_KW * jantaPowerFactor(h + m / 60) * (5 / 60);
    }
    points.push({ hour: h, y: Math.round(kwh * 100) / 100 });
  }

  return points;
}

function sumTodayKwh(tz: string) {
  const now = new Date();
  const nowMinutes = minutesSinceMidnight(now, tz);
  const intraday = buildIntradayProduction();
  let wh = 0;

  intraday.labels.forEach((label, i) => {
    const [hh, mm] = label.split(":").map(Number);
    const slotMinutes = hh * 60 + mm;
    if (slotMinutes <= nowMinutes) {
      wh += intraday.energyWh[i];
    }
  });

  return Math.round((wh / 1000) * 10) / 10;
}

function buildDailyProduction(tz: string) {
  const now = new Date();
  const parts = getZonedParts(now, tz);
  const dim = daysInMonth(now, tz);
  const labels: number[] = [];
  const values: number[] = [];
  const avgDailyKwh = 72;

  for (let day = 1; day <= dim; day++) {
    labels.push(day);
    if (day > parts.day) {
      values.push(0);
      continue;
    }
    const seasonal = 0.85 + stableNoise(day, parts.month) * 0.25;
    const kwh = Math.round((avgDailyKwh * seasonal + stableNoise(day, 7) * 6) * 10) / 10;
    values.push(day === parts.day ? sumTodayKwh(tz) : kwh);
  }

  return { labels, values };
}

function buildMonthlyProduction(tz: string) {
  const now = new Date();
  const parts = getZonedParts(now, tz);
  const labels: number[] = [];
  const values: number[] = [];
  const avgDailyKwh = 72;
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  for (let month = 1; month <= 12; month++) {
    labels.push(month);
    if (month > parts.month) {
      values.push(0);
      continue;
    }
    const seasonal = month >= 4 && month <= 9 ? 1.12 : 0.85;
    if (month === parts.month) {
      const priorDays = Math.max(0, parts.day - 1);
      const kwh = priorDays * avgDailyKwh * seasonal + sumTodayKwh(tz);
      values.push(Math.round(kwh * 10) / 10);
    } else {
      const dim = daysPerMonth[month - 1];
      values.push(Math.round(dim * avgDailyKwh * seasonal * stableNoise(month, 1)));
    }
  }

  return { labels, values };
}

function buildYearlyProduction(tz: string) {
  const parts = getZonedParts(new Date(), tz);
  const labels: number[] = [];
  const values: string[] = [];

  for (let year = parts.year - 3; year <= parts.year; year++) {
    labels.push(year);
    if (year < parts.year) {
      const mwh = (9.8 + stableNoise(year, 1) * 3.5).toFixed(2);
      values.push(mwh);
    } else {
      const ytdKwh = buildMonthlyProduction(tz).values
        .slice(0, parts.month)
        .reduce((a, b) => a + b, 0);
      values.push((ytdKwh / 1000).toFixed(2));
    }
  }

  return { labels, values };
}

function buildPerTowerHistorical(tz: string) {
  const daily = buildDailyProduction(tz);
  const monthly = buildMonthlyProduction(tz);
  const yearly = buildYearlyProduction(tz);
  const totalKwh = 9850 + sumTodayKwh(tz);
  const splits = [0.34, 0.33, 0.33];

  return splits.map((frac, i) => ({
    dailyproduction: {
      labels: daily.labels,
      values: daily.values.map((v) => Math.round(v * frac * stableNoise(i, 2) * 10) / 10),
    },
    monthlyproduction: {
      labels: monthly.labels,
      values: monthly.values.map((v) => Math.round(v * frac * stableNoise(i, 4) * 10) / 10),
    },
    yearlyproduction: {
      labels: yearly.labels,
      values: yearly.values.map((v) => (Number(v) * frac).toFixed(2)),
    },
    total: Math.round(totalKwh * frac),
  }));
}

function livePowerW(tz: string) {
  const now = new Date();
  const parts = getZonedParts(now, tz);
  const hourDec = hourDecimal(now, tz);
  const factor = jantaPowerFactor(hourDec);
  return Math.round(PEAK_KW * 1000 * factor * plateauNoise(parts.hour, parts.minute, factor));
}

export type MarketingFroniusResponse = ReturnType<typeof buildMarketingFroniusResponse>;

export function buildMarketingFroniusResponse(tz = MARKETING_SYSTEM.timezone) {
  const now = new Date();
  const parts = getZonedParts(now, tz);
  const pvPower = livePowerW(tz);
  const loadPower = Math.round(1800 + stableNoise(parts.hour, 9) * 1400);
  const exportW = Math.max(0, pvPower - loadPower);
  const importW = Math.max(0, loadPower - pvPower);
  const gridImport = importW > 0;
  const todayKwh = sumTodayKwh(tz);
  const totalKwh = 9850 + todayKwh;

  return {
    systemId: "marketing-demo",
    period: { year: parts.year, month: parts.month, day: parts.day },
    data: {
      live: {
        timestamp: now.toISOString(),
        pvPower,
        online: true,
      },
      flow: {
        pvPower,
        gridPower: gridImport ? importW : exportW,
        gridImport,
        loadPower,
        battChargePower: null,
        battSoc: null,
        hasBattery: false,
        selfConsumptionRate:
          pvPower > 0 ? Math.min(100, Math.round((loadPower / pvPower) * 100)) : null,
        selfSufficiencyRate:
          loadPower > 0 ? Math.min(100, Math.round((Math.min(pvPower, loadPower) / loadPower) * 100)) : null,
        timestamp: now.toISOString(),
      },
      hourlyproduction: buildIntradayProduction(),
      dailyproduction: buildDailyProduction(tz),
      monthlyproduction: buildMonthlyProduction(tz),
      yearlyproduction: buildYearlyProduction(tz),
      total: totalKwh,
      pertower: buildPerTowerHistorical(tz),
    },
    errors: [] as string[],
  };
}

export function marketingLivePowerKw(tz = MARKETING_SYSTEM.timezone) {
  return Math.round(livePowerW(tz) / 100) / 10;
}

export type MarketingWeather = ReturnType<typeof buildMarketingWeather>;

export function buildMarketingWeather(tz = MARKETING_SYSTEM.timezone) {
  const now = new Date();
  const parts = getZonedParts(now, tz);
  const hourly = [];

  for (let h = 0; h < 24; h++) {
    const tempC = Math.round(18 + jantaPowerFactor(h + 0.5) * 14 + stableNoise(h, 20) * 3);
    hourly.push({
      time: `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(h).padStart(2, "0")}:00:00`,
      temp: tempC,
      wind_speed: Math.round(4 + stableNoise(h, 11) * 8),
      humidity: Math.round(42 + stableNoise(h, 15) * 28),
      clouds: null,
    });
  }

  const current = hourly[parts.hour] ?? hourly[0];
  const solarNow = jantaPowerFactor(hourDecimal(now, tz));

  return {
    location: { lat: MARKETING_SYSTEM.latitude, lon: MARKETING_SYSTEM.longitude },
    current: {
      temp: current.temp,
      wind_speed: current.wind_speed,
      humidity: current.humidity,
      condition: solarNow > 0.55 ? "Sunny" : solarNow > 0.2 ? "Mostly Sunny" : "Clear",
    },
    hourly,
  };
}
