import {
  bellCurvePath,
  CHART_COLOR_JANTA,
  CHART_COLOR_TRADITIONAL,
  CHART_Y_MAX,
  jantaSummerPath,
  jantaWinterPath,
  REF_TRAD_WINTER_PEAK_KW,
  traditionalSummerPath,
  type ChartGeom,
} from "../lib/powerCurvePaths";

/** Designer tower nameplate (page copy only) */
export const DESIGNER_TOWER_KW = 5.4;

export type PowerCurveSeries = {
  id: "traditional" | "janta";
  label: string;
  color: string;
  buildPath: (geom: ChartGeom) => string;
};

export type PowerCurveChart = {
  id: "summer" | "winter";
  title: string;
  hourMin: number;
  hourMax: number;
  yMax: number;
  series: PowerCurveSeries[];
};

export const designerPowerCharts: PowerCurveChart[] = [
  {
    id: "summer",
    title: "Summer",
    hourMin: 7,
    hourMax: 22,
    yMax: CHART_Y_MAX,
    series: [
      {
        id: "traditional",
        label: "Traditional Solar",
        color: CHART_COLOR_TRADITIONAL,
        buildPath: (geom) => traditionalSummerPath(geom),
      },
      {
        id: "janta",
        label: "Janta Power",
        color: CHART_COLOR_JANTA,
        buildPath: (geom) => jantaSummerPath(geom),
      },
    ],
  },
  {
    id: "winter",
    title: "Winter",
    hourMin: 7,
    hourMax: 21,
    yMax: CHART_Y_MAX,
    series: [
      {
        id: "traditional",
        label: "Traditional Solar",
        color: CHART_COLOR_TRADITIONAL,
        buildPath: (geom) =>
          bellCurvePath(geom, 9, 19, 13.5, REF_TRAD_WINTER_PEAK_KW),
      },
      {
        id: "janta",
        label: "Janta Power",
        color: CHART_COLOR_JANTA,
        buildPath: (geom) => jantaWinterPath(geom),
      },
    ],
  },
];
