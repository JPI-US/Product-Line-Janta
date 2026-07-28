import {
  bellCurvePath,
  CHART_Y_MAX,
  JANTA_SUMMER_HOUR_MAX,
  JANTA_SUMMER_HOUR_MIN,
  JANTA_WINTER_HOUR_MAX,
  JANTA_WINTER_HOUR_MIN,
  jantaSummerKw,
  jantaSummerPath,
  jantaWinterKw,
  jantaWinterPath,
  REF_TRAD_SUMMER_PEAK_KW,
  REF_TRAD_WINTER_PEAK_KW,
  TRAD_SUMMER_HOUR_MAX,
  TRAD_SUMMER_HOUR_MIN,
  TRAD_WINTER_HOUR_MAX,
  TRAD_WINTER_HOUR_MIN,
  tradBellKw,
  traditionalSummerPath,
  WINTER_CHART_HOUR_MAX,
  WINTER_CHART_HOUR_MIN,
  type ChartGeom,
} from "../lib/powerCurvePaths";

export type PowerSeason = "summer" | "winter";

export type SeasonTheme = {
  accent: string;
  accentSoft: string;
  accentGlow: string;
  tradLine: string;
  grid: string;
  tick: string;
  cardBg: string;
  cardBorder: string;
};

export const POWER_SEASON_THEMES: Record<PowerSeason, SeasonTheme> = {
  summer: {
    accent: "#e8a820",
    accentSoft: "rgba(232, 168, 32, 0.22)",
    accentGlow: "rgba(232, 168, 32, 0.5)",
    tradLine: "rgba(36, 51, 65, 0.28)",
    grid: "rgba(36, 51, 65, 0.09)",
    tick: "rgba(36, 51, 65, 0.55)",
    cardBg: "transparent",
    cardBorder: "transparent",
  },
  winter: {
    accent: "#5eb8e8",
    accentSoft: "rgba(94, 184, 232, 0.2)",
    accentGlow: "rgba(94, 184, 232, 0.48)",
    tradLine: "rgba(36, 51, 65, 0.28)",
    grid: "rgba(36, 51, 65, 0.09)",
    tick: "rgba(36, 51, 65, 0.55)",
    cardBg: "transparent",
    cardBorder: "transparent",
  },
};

export type PowerCurveSeries = {
  id: "traditional" | "janta";
  label: string;
  buildPath: (geom: ChartGeom) => string;
  kwAtHour: (hour: number, hourMin: number, hourMax: number) => number;
};

export type PowerCurveChart = {
  id: PowerSeason;
  title: string;
  hourMin: number;
  hourMax: number;
  yMax: number;
  series: PowerCurveSeries[];
};

export const designerPowerCharts: Record<PowerSeason, PowerCurveChart> = {
  summer: {
    id: "summer",
    title: "Summer",
    hourMin: JANTA_SUMMER_HOUR_MIN,
    hourMax: JANTA_SUMMER_HOUR_MAX,
    yMax: CHART_Y_MAX,
    series: [
      {
        id: "traditional",
        label: "Traditional solar",
        buildPath: (geom) =>
          traditionalSummerPath(geom, TRAD_SUMMER_HOUR_MIN, TRAD_SUMMER_HOUR_MAX),
        kwAtHour: (h) =>
          tradBellKw(h, TRAD_SUMMER_HOUR_MIN, TRAD_SUMMER_HOUR_MAX, REF_TRAD_SUMMER_PEAK_KW),
      },
      {
        id: "janta",
        label: "Janta",
        buildPath: (geom) =>
          jantaSummerPath(geom, JANTA_SUMMER_HOUR_MIN, JANTA_SUMMER_HOUR_MAX),
        kwAtHour: (h, min, max) => jantaSummerKw(h, min, max),
      },
    ],
  },
  winter: {
    id: "winter",
    title: "Winter",
    hourMin: WINTER_CHART_HOUR_MIN,
    hourMax: WINTER_CHART_HOUR_MAX,
    yMax: CHART_Y_MAX,
    series: [
      {
        id: "traditional",
        label: "Traditional solar",
        buildPath: (geom) =>
          bellCurvePath(
            geom,
            TRAD_WINTER_HOUR_MIN,
            TRAD_WINTER_HOUR_MAX,
            (TRAD_WINTER_HOUR_MIN + TRAD_WINTER_HOUR_MAX) / 2,
            REF_TRAD_WINTER_PEAK_KW,
          ),
        kwAtHour: (h) =>
          tradBellKw(h, TRAD_WINTER_HOUR_MIN, TRAD_WINTER_HOUR_MAX, REF_TRAD_WINTER_PEAK_KW),
      },
      {
        id: "janta",
        label: "Janta",
        buildPath: (geom) =>
          jantaWinterPath(geom, JANTA_WINTER_HOUR_MIN, JANTA_WINTER_HOUR_MAX),
        kwAtHour: (h) =>
          jantaWinterKw(h, JANTA_WINTER_HOUR_MIN, JANTA_WINTER_HOUR_MAX),
      },
    ],
  },
};

/** Designer tower nameplate (page copy only) */
export const DESIGNER_TOWER_KW = 5.4;
