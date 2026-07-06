import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import {
  designerPowerCharts,
  type PowerCurveChart,
} from "../data/designerPowerCurves";
import {
  CHART_COLOR_JANTA,
  CHART_COLOR_TRADITIONAL,
  type ChartGeom,
} from "../lib/powerCurvePaths";
import { useSectionReveal } from "./useSectionReveal";

const CHART = {
  width: 520,
  height: 220,
  pad: { top: 14, right: 12, bottom: 28, left: 32 },
} as const;

const SERIES_LEGEND = [
  { id: "janta", label: "Janta Power", color: CHART_COLOR_JANTA },
  { id: "traditional", label: "Traditional Solar", color: CHART_COLOR_TRADITIONAL },
] as const;

function formatHour(hour: number): string {
  return `${hour}:00`;
}

function chartGeometry(chart: PowerCurveChart): ChartGeom & { plotRight: number } {
  const plotW = CHART.width - CHART.pad.left - CHART.pad.right;
  const plotH = CHART.height - CHART.pad.top - CHART.pad.bottom;
  const hourSpan = chart.hourMax - chart.hourMin;

  const x = (hour: number) =>
    CHART.pad.left + ((hour - chart.hourMin) / hourSpan) * plotW;

  const y = (kw: number) => CHART.pad.top + plotH - (kw / chart.yMax) * plotH;

  return { x, y, plotRight: CHART.width - CHART.pad.right };
}

function PowerChartPlot({
  chart,
  isVisible,
  plotIndex,
}: {
  chart: PowerCurveChart;
  isVisible: boolean;
  plotIndex: number;
}) {
  const reducedMotion = useReducedMotion();
  const geom = useMemo(() => chartGeometry(chart), [chart]);

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let h = chart.hourMin; h <= chart.hourMax; h += 1) ticks.push(h);
    return ticks;
  }, [chart.hourMin, chart.hourMax]);

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let kw = 0; kw <= chart.yMax; kw += 1) ticks.push(kw);
    return ticks;
  }, [chart.yMax]);

  const seriesPaths = useMemo(
    () =>
      chart.series.map((series) => ({
        id: series.id,
        color: series.color,
        d: series.buildPath(geom),
      })),
    [chart.series, geom],
  );

  const animateLines = isVisible && !reducedMotion;
  const plotLeft = CHART.pad.left;
  const plotBottom = CHART.height - CHART.pad.bottom;

  return (
    <figure className="tower-3d__power-charts__card">
      <figcaption className="tower-3d__power-charts__card-title">{chart.title}</figcaption>
      <div className="tower-3d__power-charts__card-body">
        <svg
          className="tower-3d__power-charts__svg"
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${chart.title}: traditional solar versus Janta tower output`}
        >
          {yTicks.map((kw) => {
            const y = geom.y(kw);
            return (
              <line
                key={kw}
                x1={plotLeft}
                x2={geom.plotRight}
                y1={y}
                y2={y}
                className="tower-3d__power-charts__grid"
              />
            );
          })}

          <line
            x1={plotLeft}
            x2={geom.plotRight}
            y1={plotBottom}
            y2={plotBottom}
            className="tower-3d__power-charts__axis"
          />

          {yTicks.map((kw) => (
            <text
              key={kw}
              x={plotLeft - 5}
              y={geom.y(kw) + 3}
              className="tower-3d__power-charts__tick-y"
              textAnchor="end"
            >
              {kw}
            </text>
          ))}

          {xTicks.map((hour) => (
            <text
              key={hour}
              x={geom.x(hour)}
              y={CHART.height - 8}
              className="tower-3d__power-charts__tick-x"
              textAnchor="middle"
            >
              {formatHour(hour)}
            </text>
          ))}

          {seriesPaths.map((series, seriesIndex) => (
            <motion.path
              key={series.id}
              d={series.d}
              fill="none"
              stroke={series.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 1 : 0 }}
              transition={
                animateLines
                  ? {
                      opacity: {
                        duration: 0.45,
                        delay: 0.08 + seriesIndex * 0.1 + plotIndex * 0.12,
                        ease: [0.22, 1, 0.36, 1],
                      },
                    }
                  : { duration: 0 }
              }
            />
          ))}
        </svg>
      </div>
    </figure>
  );
}

/** Summer / winter power curves — separate section below specs */
export function DesignerPowerChartsSection() {
  const { sectionRef, isVisible } = useSectionReveal(
    "tower-3d__power-charts-section--visible",
  );

  return (
    <section
      ref={sectionRef}
      className="tower-3d__power-charts-section"
      aria-labelledby="tower-power-charts-title"
    >
      <div className="tower-3d__power-charts__inner">
        <header className="tower-3d__power-charts__header">
          <p className="tower-3d__below-eyebrow">Compared</p>
          <h2 id="tower-power-charts-title" className="tower-3d__below-title">
            Fixed solar vs Janta
          </h2>
        </header>

        <ul className="tower-3d__power-charts__legend" aria-label="Chart series">
          {SERIES_LEGEND.map((item) => (
            <li key={item.id}>
              <span
                className="tower-3d__power-charts__legend-dot"
                style={{ background: item.color }}
              />
              {item.label}
            </li>
          ))}
        </ul>

        <div className="tower-3d__power-charts__grid">
          {designerPowerCharts.map((chart, index) => (
            <PowerChartPlot
              key={chart.id}
              chart={chart}
              isVisible={isVisible}
              plotIndex={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
