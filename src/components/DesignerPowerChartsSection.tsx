import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import {
  designerPowerCharts,
  POWER_SEASON_THEMES,
  type PowerCurveChart,
  type PowerSeason,
} from "../data/designerPowerCurves";
import type { ChartGeom } from "../lib/powerCurvePaths";
import { useSectionReveal } from "./useSectionReveal";

const HubFirefliesCanvas = lazy(() =>
  import("./HubFirefliesCanvas").then((m) => ({ default: m.HubFirefliesCanvas })),
);
const HubWeatherCanvas = lazy(() =>
  import("./HubWeatherCanvas").then((m) => ({ default: m.HubWeatherCanvas })),
);

const SEASON_CYCLE_MS = 7000;
const CHART = {
  width: 1200,
  height: 540,
  pad: { top: 44, right: 56, bottom: 56, left: 64 },
} as const;

const SEASONS: { id: PowerSeason; label: string }[] = [
  { id: "summer", label: "Summer" },
  { id: "winter", label: "Winter" },
];

type HoverState = {
  hour: number;
  x: number;
  jantaKw: number;
  tradKw: number;
};

function areaPath(
  linePath: string,
  geom: ChartGeom,
  hourMin: number,
  hourMax: number,
): string {
  const y0 = geom.y(0);
  return `${linePath} L ${geom.x(hourMax).toFixed(2)} ${y0.toFixed(2)} L ${geom.x(hourMin).toFixed(2)} ${y0.toFixed(2)} Z`;
}

function formatHour(hour: number): string {
  return `${hour}:00`;
}

function formatKw(kw: number): string {
  return `${kw.toFixed(1)} kW`;
}

function hourTickStep(hourMin: number, hourMax: number): number {
  return hourMax - hourMin > 13 ? 2 : 1;
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

function hourFromSvgX(
  svgX: number,
  chart: PowerCurveChart,
  geom: ChartGeom & { plotRight: number },
): number | null {
  const { plotRight } = geom;
  const plotLeft = CHART.pad.left;
  if (svgX < plotLeft || svgX > plotRight) return null;

  const fraction = (svgX - plotLeft) / (plotRight - plotLeft);
  const hour = chart.hourMin + fraction * (chart.hourMax - chart.hourMin);
  return Math.max(chart.hourMin, Math.min(chart.hourMax, Math.round(hour)));
}

function PowerChartPlot({
  chart,
  season,
  isVisible,
}: {
  chart: PowerCurveChart;
  season: PowerSeason;
  isVisible: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const theme = POWER_SEASON_THEMES[season];
  const geom = useMemo(() => chartGeometry(chart), [chart]);
  const step = hourTickStep(chart.hourMin, chart.hourMax);

  const tradSeries = chart.series.find((s) => s.id === "traditional");
  const jantaSeries = chart.series.find((s) => s.id === "janta");

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let h = chart.hourMin; h <= chart.hourMax; h += step) ticks.push(h);
    return ticks;
  }, [chart.hourMin, chart.hourMax, step]);

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let kw = 0; kw <= chart.yMax; kw += 1) ticks.push(kw);
    return ticks;
  }, [chart.yMax]);

  const seriesPaths = useMemo(
    () =>
      chart.series.map((series) => ({
        id: series.id,
        d: series.buildPath(geom),
        kwAtHour: series.kwAtHour,
      })),
    [chart.series, geom],
  );

  const plotLeft = CHART.pad.left;
  const plotBottom = CHART.height - CHART.pad.bottom;
  const plotMidY = (CHART.pad.top + plotBottom) / 2;
  const gradId = `pc-janta-grad-${season}`;
  const glowId = `pc-janta-glow-${season}`;
  const fade = reducedMotion
    ? { duration: 0 }
    : { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const };

  const trad = seriesPaths.find((s) => s.id === "traditional");
  const janta = seriesPaths.find((s) => s.id === "janta");

  const updateHover = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg || !tradSeries || !jantaSeries) {
        setHover(null);
        return;
      }

      const rect = svg.getBoundingClientRect();
      if (!rect.width) return;

      const vb = svg.viewBox.baseVal;
      const svgX = ((clientX - rect.left) / rect.width) * vb.width;
      const hour = hourFromSvgX(svgX, chart, geom);
      if (hour == null) {
        setHover(null);
        return;
      }

      setHover({
        hour,
        x: geom.x(hour),
        jantaKw: jantaSeries.kwAtHour(hour, chart.hourMin, chart.hourMax),
        tradKw: tradSeries.kwAtHour(hour, chart.hourMin, chart.hourMax),
      });
    },
    [chart, geom, jantaSeries, tradSeries],
  );

  const handleMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    updateHover(event.clientX);
  };

  const handleMouseLeave = () => setHover(null);

  const tooltipX = hover
    ? Math.min(hover.x + 14, geom.plotRight - 108)
    : 0;
  const tooltipY = CHART.pad.top + 8;

  return (
    <motion.div
      className="tower-3d__power-charts__canvas"
      style={
        {
          "--pc-accent": theme.accent,
          "--pc-grid": theme.grid,
          "--pc-tick": theme.tick,
          "--pc-trad": theme.tradLine,
        } as CSSProperties
      }
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={fade}
    >
      <svg
        ref={svgRef}
        className="tower-3d__power-charts__svg tower-3d__power-charts__svg--interactive"
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="application"
        aria-label={`${chart.title} power output chart. Hover to inspect hourly values.`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.accent} stopOpacity="0.38" />
            <stop offset="55%" stopColor={theme.accent} stopOpacity="0.1" />
            <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect
          x={plotLeft}
          y={CHART.pad.top}
          width={geom.plotRight - plotLeft}
          height={plotBottom - CHART.pad.top}
          fill="transparent"
          className="tower-3d__power-charts__hit"
        />

        {yTicks.map((kw) => (
          <line
            key={kw}
            x1={plotLeft}
            x2={geom.plotRight}
            y1={geom.y(kw)}
            y2={geom.y(kw)}
            className="tower-3d__power-charts__grid-h"
          />
        ))}

        {xTicks.map((hour) => (
          <line
            key={`v-${hour}`}
            x1={geom.x(hour)}
            x2={geom.x(hour)}
            y1={CHART.pad.top}
            y2={plotBottom}
            className="tower-3d__power-charts__grid-v"
          />
        ))}

        <line
          x1={plotLeft}
          x2={geom.plotRight}
          y1={plotBottom}
          y2={plotBottom}
          className="tower-3d__power-charts__axis"
        />
        <line
          x1={plotLeft}
          x2={plotLeft}
          y1={CHART.pad.top}
          y2={plotBottom}
          className="tower-3d__power-charts__axis"
        />

        {yTicks.map((kw) => (
          <text
            key={kw}
            x={plotLeft - 10}
            y={geom.y(kw) + 4}
            className="tower-3d__power-charts__tick-y"
            textAnchor="end"
          >
            {kw}
          </text>
        ))}

        <text
          x={plotLeft - 36}
          y={plotMidY}
          className="tower-3d__power-charts__axis-label tower-3d__power-charts__axis-label--y"
          textAnchor="middle"
          transform={`rotate(-90 ${plotLeft - 36} ${plotMidY})`}
        >
          kW
        </text>

        {xTicks.map((hour) => (
          <text
            key={hour}
            x={geom.x(hour)}
            y={plotBottom + 22}
            className="tower-3d__power-charts__tick-x"
            textAnchor="middle"
          >
            {formatHour(hour)}
          </text>
        ))}

        {trad ? (
          <path
            d={trad.d}
            fill="none"
            stroke="var(--pc-trad)"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        ) : null}

        {janta ? (
          <>
            <path
              d={areaPath(janta.d, geom, chart.hourMin, chart.hourMax)}
              fill={`url(#${gradId})`}
              stroke="none"
              pointerEvents="none"
            />
            <path
              d={janta.d}
              fill="none"
              stroke={theme.accent}
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              filter={`url(#${glowId})`}
              pointerEvents="none"
            />
          </>
        ) : null}

        {hover ? (
          <g className="tower-3d__power-charts__hover" pointerEvents="none">
            <line
              x1={hover.x}
              x2={hover.x}
              y1={CHART.pad.top}
              y2={plotBottom}
              className="tower-3d__power-charts__crosshair"
            />
            <circle
              cx={hover.x}
              cy={geom.y(hover.jantaKw)}
              r={4}
              className="tower-3d__power-charts__hover-dot tower-3d__power-charts__hover-dot--janta"
            />
            <circle
              cx={hover.x}
              cy={geom.y(hover.tradKw)}
              r={3.5}
              className="tower-3d__power-charts__hover-dot tower-3d__power-charts__hover-dot--trad"
            />
            <foreignObject
              x={tooltipX}
              y={tooltipY}
              width={120}
              height={72}
              className="tower-3d__power-charts__tooltip-host"
            >
              <div className="tower-3d__power-charts__tooltip">
                <p className="tower-3d__power-charts__tooltip-time">
                  {formatHour(hover.hour)}
                </p>
                <p className="tower-3d__power-charts__tooltip-row tower-3d__power-charts__tooltip-row--janta">
                  <span>Janta</span>
                  <span>{formatKw(hover.jantaKw)}</span>
                </p>
                <p className="tower-3d__power-charts__tooltip-row tower-3d__power-charts__tooltip-row--trad">
                  <span>Traditional</span>
                  <span>{formatKw(hover.tradKw)}</span>
                </p>
              </div>
            </foreignObject>
          </g>
        ) : null}
      </svg>
    </motion.div>
  );
}

/** Compared — full-bleed chart with weather shift and auto-cycle */
export function DesignerPowerChartsSection() {
  const reducedMotion = useReducedMotion();
  const { sectionRef, isVisible } = useSectionReveal(
    "tower-3d__power-charts-section--visible",
  );
  const [season, setSeason] = useState<PowerSeason>("summer");
  const chart = designerPowerCharts[season];

  const pickSeason = useCallback((next: PowerSeason) => {
    setSeason(next);
  }, []);

  useEffect(() => {
    if (!isVisible || reducedMotion) return;

    const timer = window.setInterval(() => {
      setSeason((prev) => (prev === "summer" ? "winter" : "summer"));
    }, SEASON_CYCLE_MS);

    return () => window.clearInterval(timer);
  }, [isVisible, reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="tower-3d__power-charts-section tower-3d__power-charts-section--compare"
      data-season={season}
      aria-labelledby="tower-power-charts-title"
    >
      <div className="tower-3d__power-charts__weather" aria-hidden>
        <div className="tower-3d__power-charts__atmosphere tower-3d__power-charts__atmosphere--summer" />
        <div className="tower-3d__power-charts__atmosphere tower-3d__power-charts__atmosphere--winter" />
        <div
          className={`tower-3d__power-charts__weather-layer${
            season === "summer" ? " is-active" : ""
          }`}
        >
          <Suspense fallback={null}>
            <HubFirefliesCanvas lite ungated skyPeriod="day" opacity={0.55} />
          </Suspense>
        </div>
        <div
          className={`tower-3d__power-charts__weather-layer${
            season === "winter" ? " is-active" : ""
          }`}
        >
          <Suspense fallback={null}>
            <HubWeatherCanvas kind="snow" intensity={0.55} />
          </Suspense>
        </div>
      </div>

      <div className="tower-3d__power-charts__inner">
        <header className="tower-3d__power-charts__header">
          <h2 id="tower-power-charts-title" className="tower-3d__below-title">
            Fixed solar vs Janta
          </h2>
        </header>

        <div className="tower-3d__power-charts__stage" aria-live="polite" aria-atomic="true">
          <AnimatePresence mode="wait">
            <PowerChartPlot
              key={season}
              chart={chart}
              season={season}
              isVisible={isVisible}
            />
          </AnimatePresence>
        </div>

        <div className="tower-3d__power-charts__controls">
          <div className="tower-3d__power-charts__season" role="tablist" aria-label="Season">
            {SEASONS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={season === item.id}
                className={`tower-3d__power-charts__season-btn${
                  season === item.id ? " is-active" : ""
                }`}
                onClick={() => pickSeason(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
