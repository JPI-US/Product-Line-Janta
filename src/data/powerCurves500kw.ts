import {
  bellCurvePath,
  JANTA_SUMMER_HOUR_MAX,
  JANTA_SUMMER_HOUR_MIN,
  JANTA_WINTER_HOUR_MAX,
  JANTA_WINTER_HOUR_MIN,
  jantaSummerKw,
  jantaSummerPath,
  jantaWinterKw,
  jantaWinterPath,
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
import type { PowerCurveChart, PowerSeason } from "./designerPowerCurves";

/** Scaled to 500 kW Dallas yield targets (805.6k fixed / 1.208M Janta — 50% gap). */
const SUMMER_TRAD_PEAK_KW = 255.5;
const SUMMER_JANTA_PEAK_KW = 255.5;
/** Slightly softer midday dip — fixed solar still crosses above the trough */
const SUMMER_JANTA_TROUGH_KW = 173;
const WINTER_TRAD_PEAK_KW = 236.5;
const WINTER_JANTA_PEAK_KW = 295.6;

export const POWER_500KW_CHART_Y_MAX = 500;

export const powerCurves500kw: Record<PowerSeason, PowerCurveChart> = {
  summer: {
    id: "summer",
    title: "Summer",
    hourMin: JANTA_SUMMER_HOUR_MIN,
    hourMax: JANTA_SUMMER_HOUR_MAX,
    yMax: POWER_500KW_CHART_Y_MAX,
    series: [
      {
        id: "traditional",
        label: "Fixed solar",
        buildPath: (geom: ChartGeom) =>
          traditionalSummerPath(
            geom,
            TRAD_SUMMER_HOUR_MIN,
            TRAD_SUMMER_HOUR_MAX,
            SUMMER_TRAD_PEAK_KW,
          ),
        kwAtHour: (h) =>
          tradBellKw(h, TRAD_SUMMER_HOUR_MIN, TRAD_SUMMER_HOUR_MAX, SUMMER_TRAD_PEAK_KW),
      },
      {
        id: "janta",
        label: "Janta",
        buildPath: (geom: ChartGeom) =>
          jantaSummerPath(
            geom,
            JANTA_SUMMER_HOUR_MIN,
            JANTA_SUMMER_HOUR_MAX,
            SUMMER_JANTA_PEAK_KW,
            SUMMER_JANTA_TROUGH_KW,
          ),
        kwAtHour: (h, min, max) =>
          jantaSummerKw(
            h,
            min,
            max,
            SUMMER_JANTA_PEAK_KW,
            SUMMER_JANTA_TROUGH_KW,
          ),
      },
    ],
  },
  winter: {
    id: "winter",
    title: "Winter",
    hourMin: WINTER_CHART_HOUR_MIN,
    hourMax: WINTER_CHART_HOUR_MAX,
    yMax: POWER_500KW_CHART_Y_MAX,
    series: [
      {
        id: "traditional",
        label: "Fixed solar",
        buildPath: (geom: ChartGeom) =>
          bellCurvePath(
            geom,
            TRAD_WINTER_HOUR_MIN,
            TRAD_WINTER_HOUR_MAX,
            (TRAD_WINTER_HOUR_MIN + TRAD_WINTER_HOUR_MAX) / 2,
            WINTER_TRAD_PEAK_KW,
          ),
        kwAtHour: (h) =>
          tradBellKw(h, TRAD_WINTER_HOUR_MIN, TRAD_WINTER_HOUR_MAX, WINTER_TRAD_PEAK_KW),
      },
      {
        id: "janta",
        label: "Janta",
        buildPath: (geom: ChartGeom) =>
          jantaWinterPath(geom, JANTA_WINTER_HOUR_MIN, JANTA_WINTER_HOUR_MAX, WINTER_JANTA_PEAK_KW),
        kwAtHour: (h) =>
          jantaWinterKw(h, JANTA_WINTER_HOUR_MIN, JANTA_WINTER_HOUR_MAX, WINTER_JANTA_PEAK_KW),
      },
    ],
  },
};
