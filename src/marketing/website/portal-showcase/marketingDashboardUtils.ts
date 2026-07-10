/** Portal dashboard helpers for the marketing showcase fork. */

export const PORTAL_LIGHT_THEME = {
  pageBg: "#F4F6F9",
  cardBg: "#FFFFFF",
  cardBorder: "1px solid rgba(26,37,53,0.07)",
  cardShadow:
    "0 4px 6px rgba(26,37,53,0.04), 0 8px 24px rgba(26,37,53,0.08), 0 1px 2px rgba(26,37,53,0.06)",
  cardRadius: 20,
  text1: "#1A2535",
  text2: "#3D5068",
  text3: "#7A90A8",
  border: "rgba(26,37,53,0.08)",
  amber: "#E8A020",
  amberDim: "rgba(232,160,32,0.12)",
  green: "#4A9E78",
  gaugeTrack: "rgba(26,37,53,0.10)",
  gaugeRing: "#F3B664",
  chartGrid: "rgba(26,37,53,0.06)",
  sidebarBg: "#1A2535",
} as const;

export const HEALTH_COMPONENTS = [
  "Inverter",
  "Motor",
  "Sensors",
  "Network",
  "PV Panels",
  "Relay",
] as const;

const GLANCE_TIME_PAD_HOURS = 1;

export function formatHourLong(h: number) {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export function chartYScale(maxVal: number) {
  const padded = Math.max(maxVal * 1.15, 0.5);
  let step: number;
  if (padded <= 1) step = 0.25;
  else if (padded <= 2.5) step = 0.5;
  else if (padded <= 6) step = 1;
  else if (padded <= 18) step = 2;
  else if (padded <= 40) step = 5;
  else step = 10;
  const max = Math.ceil(padded / step) * step;
  return { max, step };
}

/** Daylight glance window — padded start, hard stop at 8 PM so labels read cleanly. */
export function productionHourRange(labels: string[] | undefined, values: number[] | undefined) {
  if (!labels?.length) return { start: 6, end: 20 };
  let minH = 24;
  let maxH = 0;
  labels.forEach((label, i) => {
    const [hh] = String(label).split(":").map(Number);
    const watts = Number(values?.[i]) || 0;
    if (watts > 0) {
      if (hh < minH) minH = hh;
      if (hh > maxH) maxH = hh;
    }
  });
  if (minH > maxH) return { start: 6, end: 20 };
  return {
    start: Math.max(0, minH - GLANCE_TIME_PAD_HOURS),
    end: 20, // 8 PM — hard stop so energy + power charts share a sensible day window
  };
}

export function getTowerDirection(deg: number | string) {
  const d = typeof deg === "string" ? parseFloat(deg) : deg;
  if (Number.isNaN(d)) return "n/a";
  if (d >= 67.5 && d < 112.5) return "East";
  if (d >= 112.5 && d < 157.5) return "South-East";
  if (d >= 157.5 && d < 202.5) return "South";
  if (d >= 202.5 && d < 247.5) return "South-West";
  if (d >= 247.5 && d < 292.5) return "West";
  return "South";
}

export const WEATHER_UI: Record<string, { icon: string; title: string }> = {
  Sunny: { icon: "☀️", title: "Clear Sky" },
  Clear: { icon: "☀️", title: "Clear Sky" },
  "Mostly Sunny": { icon: "🌤️", title: "Mostly Sunny" },
  "Partly Sunny": { icon: "🌤️", title: "Partly Sunny" },
  "Partly Cloudy": { icon: "⛅", title: "Partly Cloudy" },
  "Mostly Cloudy": { icon: "⛅", title: "Mostly Cloudy" },
  Cloudy: { icon: "☁️", title: "Cloudy" },
  default: { icon: "🌡️", title: "Weather Update" },
};

/** Average kW per clock hour — max() hid the evening drop-off that energy already showed. */
export function hourlyPowerKwByHour(hourlyProduction: {
  labels: string[];
  values: number[];
}) {
  const sums = Array(24).fill(0);
  const counts = Array(24).fill(0);
  hourlyProduction.labels.forEach((timeLabel, i) => {
    const [hh] = timeLabel.split(":").map(Number);
    const powerW = Number(hourlyProduction.values[i]) || 0;
    sums[hh] += powerW;
    counts[hh] += 1;
  });
  return sums.map((sum, h) => (counts[h] ? sum / counts[h] / 1000 : 0));
}

export function avgPowerKw(hourlyProduction: { values: number[] }) {
  const vals = hourlyProduction.values;
  if (!vals.length) return 0;
  const sum = vals.reduce((acc, v) => acc + (Number(v) || 0), 0);
  return Math.round((sum / vals.length / 1000) * 10) / 10;
}
