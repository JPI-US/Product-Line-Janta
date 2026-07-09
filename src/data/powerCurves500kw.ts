import {
  bellCurvePath,
  jantaSummerKw,
  jantaSummerPath,
  jantaWinterKw,
  jantaWinterPath,
  tradBellKw,
  traditionalSummerPath,
  type ChartGeom,
} from "../lib/powerCurvePaths";
import type { PowerCurveChart, PowerSeason } from "./designerPowerCurves";

/** Scaled to 500 kW Dallas yield targets (805.6k fixed / 1.208M Janta — 50% gap). */
const SUMMER_TRAD_PEAK_KW = 220.7;
const SUMMER_JANTA_PEAK_KW = 255.5;
const SUMMER_JANTA_TROUGH_KW = 193;
const WINTER_TRAD_PEAK_KW = 236.5;
const WINTER_JANTA_PEAK_KW = 295.6;

export const POWER_500KW_CHART_Y_MAX = 500;

export const powerCurves500kw: Record<PowerSeason, PowerCurveChart> = {
  summer: {
    id: "summer",
    title: "Summer",
    hourMin: 7,
    hourMax: 22,
    yMax: POWER_500KW_CHART_Y_MAX,
    series: [
      {
        id: "traditional",
        label: "Fixed solar",
        buildPath: (geom: ChartGeom) =>
          traditionalSummerPath(geom, 7, 22, SUMMER_TRAD_PEAK_KW),
        kwAtHour: (h, min, max) => tradBellKw(h, min, max, SUMMER_TRAD_PEAK_KW),
      },
      {
        id: "janta",
        label: "Janta",
        buildPath: (geom: ChartGeom) =>
          jantaSummerPath(geom, 7, 22, SUMMER_JANTA_PEAK_KW, SUMMER_JANTA_TROUGH_KW),
        kwAtHour: (h, min, max) =>
          jantaSummerKw(h, min, max, SUMMER_JANTA_PEAK_KW, SUMMER_JANTA_TROUGH_KW),
      },
    ],
  },
  winter: {
    id: "winter",
    title: "Winter",
    hourMin: 7,
    hourMax: 21,
    yMax: POWER_500KW_CHART_Y_MAX,
    series: [
      {
        id: "traditional",
        label: "Fixed solar",
        buildPath: (geom: ChartGeom) =>
          bellCurvePath(geom, 7, 21, 14, WINTER_TRAD_PEAK_KW),
        kwAtHour: (h, min, max) => tradBellKw(h, min, max, WINTER_TRAD_PEAK_KW),
      },
      {
        id: "janta",
        label: "Janta",
        buildPath: (geom: ChartGeom) => jantaWinterPath(geom, 7, 21, WINTER_JANTA_PEAK_KW),
        kwAtHour: (h, min, max) => jantaWinterKw(h, min, max, WINTER_JANTA_PEAK_KW),
      },
    ],
  },
};
