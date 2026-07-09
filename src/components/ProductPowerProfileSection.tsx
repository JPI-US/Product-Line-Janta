import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  designerPowerCharts,
  type PowerCurveChart,
  type PowerSeason,
} from "../data/designerPowerCurves";
import { powerCurves500kw } from "../data/powerCurves500kw";
import type { ChartGeom } from "../lib/powerCurvePaths";
import { useWebsiteReducedMotion } from "../marketing/website/useWebsiteReducedMotion";

export type PowerProfileScenario = "product" | "500kw-dallas";

const CHART = {
  width: 1000,
  height: 440,
  pad: { top: 28, right: 26, bottom: 46, left: 50 },
} as const;

const SEASONS: { id: PowerSeason; label: string }[] = [
  { id: "summer", label: "Summer" },
  { id: "winter", label: "Winter" },
];

const SEASON_CYCLE_MS = 4000;

type Geom = ChartGeom & { plotRight: number };

type HoverState = {
  hour: number;
  x: number;
  jantaKw: number;
  tradKw: number;
};

function chartGeometry(chart: PowerCurveChart): Geom {
  const plotW = CHART.width - CHART.pad.left - CHART.pad.right;
  const plotH = CHART.height - CHART.pad.top - CHART.pad.bottom;
  const hourSpan = chart.hourMax - chart.hourMin;
  const x = (hour: number) =>
    CHART.pad.left + ((hour - chart.hourMin) / hourSpan) * plotW;
  const y = (kw: number) => CHART.pad.top + plotH - (kw / chart.yMax) * plotH;
  return { x, y, plotRight: CHART.width - CHART.pad.right };
}

function areaPath(
  linePath: string,
  geom: Geom,
  hourMin: number,
  hourMax: number,
): string {
  const y0 = geom.y(0);
  return `${linePath} L ${geom.x(hourMax).toFixed(2)} ${y0.toFixed(2)} L ${geom
    .x(hourMin)
    .toFixed(2)} ${y0.toFixed(2)} Z`;
}

function hourFromSvgX(svgX: number, chart: PowerCurveChart, geom: Geom): number | null {
  if (svgX < CHART.pad.left || svgX > geom.plotRight) return null;
  const fraction = (svgX - CHART.pad.left) / (geom.plotRight - CHART.pad.left);
  const hour = chart.hourMin + fraction * (chart.hourMax - chart.hourMin);
  return Math.max(chart.hourMin, Math.min(chart.hourMax, Math.round(hour)));
}

function fmtHour(h: number): string {
  const suffix = h >= 12 ? "pm" : "am";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${suffix}`;
}

function fmtKw(kw: number): string {
  return kw >= 100 ? `${Math.round(kw)} kW` : `${kw.toFixed(1)} kW`;
}

function yTickStep(yMax: number): number {
  if (yMax <= 10) return 1;
  if (yMax <= 100) return 10;
  return 50;
}

function PowerProfileChart({ chart }: { chart: PowerCurveChart }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const geom = useMemo(() => chartGeometry(chart), [chart]);

  const step = chart.hourMax - chart.hourMin > 13 ? 3 : 2;
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let h = chart.hourMin; h <= chart.hourMax; h += step) ticks.push(h);
    return ticks;
  }, [chart.hourMin, chart.hourMax, step]);

  const yTicks = useMemo(() => {
    const step = yTickStep(chart.yMax);
    const ticks: number[] = [];
    for (let kw = 0; kw <= chart.yMax; kw += step) ticks.push(kw);
    return ticks;
  }, [chart.yMax]);

  const trad = chart.series.find((s) => s.id === "traditional")!;
  const janta = chart.series.find((s) => s.id === "janta")!;
  const tradPath = useMemo(() => trad.buildPath(geom), [trad, geom]);
  const jantaPath = useMemo(() => janta.buildPath(geom), [janta, geom]);

  const plotBottom = CHART.height - CHART.pad.bottom;
  const midY = (CHART.pad.top + plotBottom) / 2;
  const gradId = `pp-grad-${chart.id}`;
  const tooltipW = 132;
  const tooltipX = hover
    ? Math.min(Math.max(hover.x - tooltipW / 2, CHART.pad.left), geom.plotRight - tooltipW)
    : 0;

  const handleMove = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      const vb = svg.viewBox.baseVal;
      const svgX = ((event.clientX - rect.left) / rect.width) * vb.width;
      const hour = hourFromSvgX(svgX, chart, geom);
      if (hour == null) {
        setHover(null);
        return;
      }
      setHover({
        hour,
        x: geom.x(hour),
        jantaKw: janta.kwAtHour(hour, chart.hourMin, chart.hourMax),
        tradKw: trad.kwAtHour(hour, chart.hourMin, chart.hourMax),
      });
    },
    [chart, geom, janta, trad],
  );

  return (
    <svg
      ref={svgRef}
      className="tower-3d__power-profile__svg"
      viewBox={`0 0 ${CHART.width} ${CHART.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${chart.title} daily output — Janta tracking versus fixed solar, kilowatts by hour.`}
      onPointerMove={handleMove}
      onPointerLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--web-brand-blue, #3a84dc)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--web-brand-blue, #3a84dc)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {yTicks.map((kw) => (
        <line
          key={kw}
          x1={CHART.pad.left}
          x2={geom.plotRight}
          y1={geom.y(kw)}
          y2={geom.y(kw)}
          className="tower-3d__power-profile__grid"
        />
      ))}

      <line
        x1={CHART.pad.left}
        x2={geom.plotRight}
        y1={plotBottom}
        y2={plotBottom}
        className="tower-3d__power-profile__axis"
      />

      {yTicks.map((kw) => (
        <text
          key={kw}
          x={CHART.pad.left - 10}
          y={geom.y(kw) + 4}
          className="tower-3d__power-profile__tick"
          textAnchor="end"
        >
          {kw}
        </text>
      ))}

      {xTicks.map((h) => (
        <text
          key={h}
          x={geom.x(h)}
          y={plotBottom + 24}
          className="tower-3d__power-profile__tick"
          textAnchor="middle"
        >
          {fmtHour(h)}
        </text>
      ))}

      <text
        x={CHART.pad.left - 34}
        y={midY}
        className="tower-3d__power-profile__axis-label"
        textAnchor="middle"
        transform={`rotate(-90 ${CHART.pad.left - 34} ${midY})`}
      >
        kW output
      </text>

      <path
        d={tradPath}
        className="tower-3d__power-profile__line tower-3d__power-profile__line--trad"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />

      <path
        d={areaPath(jantaPath, geom, chart.hourMin, chart.hourMax)}
        className="tower-3d__power-profile__area"
        fill={`url(#${gradId})`}
        stroke="none"
      />
      <path
        d={jantaPath}
        className="tower-3d__power-profile__line tower-3d__power-profile__line--janta"
        fill="none"
        pathLength={1}
        vectorEffect="non-scaling-stroke"
      />

      {hover ? (
        <g className="tower-3d__power-profile__hover" pointerEvents="none">
          <line
            x1={hover.x}
            x2={hover.x}
            y1={CHART.pad.top}
            y2={plotBottom}
            className="tower-3d__power-profile__crosshair"
          />
          <circle
            cx={hover.x}
            cy={geom.y(hover.tradKw)}
            r={3.5}
            className="tower-3d__power-profile__dot tower-3d__power-profile__dot--trad"
          />
          <circle
            cx={hover.x}
            cy={geom.y(hover.jantaKw)}
            r={4}
            className="tower-3d__power-profile__dot tower-3d__power-profile__dot--janta"
          />
          <foreignObject
            x={tooltipX}
            y={CHART.pad.top - 6}
            width={tooltipW}
            height={82}
            className="tower-3d__power-profile__tt-host"
          >
            <div className="tower-3d__power-profile__tt">
              <p className="tower-3d__power-profile__tt-time">{fmtHour(hover.hour)}</p>
              <p className="tower-3d__power-profile__tt-row tower-3d__power-profile__tt-row--janta">
                <span>Janta</span>
                <span>{fmtKw(hover.jantaKw)}</span>
              </p>
              <p className="tower-3d__power-profile__tt-row tower-3d__power-profile__tt-row--trad">
                <span>Fixed</span>
                <span>{fmtKw(hover.tradKw)}</span>
              </p>
            </div>
          </foreignObject>
        </g>
      ) : null}
    </svg>
  );
}

/** Daily power shape — Janta tracking vs fixed solar, toggled by season. */
export function ProductPowerProfileSection({
  scenario = "product",
  lede = "Tracking holds output from morning to evening, instead of a single midday peak.",
  autoCycleSeason = true,
}: {
  scenario?: PowerProfileScenario;
  lede?: string;
  autoCycleSeason?: boolean;
}) {
  const reducedMotion = useWebsiteReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [season, setSeason] = useState<PowerSeason>("summer");
  const [cycleKey, setCycleKey] = useState(0);
  const charts = scenario === "500kw-dallas" ? powerCurves500kw : designerPowerCharts;
  const chart = charts[season];

  const selectSeason = (id: PowerSeason) => {
    setSeason(id);
    setCycleKey((key) => key + 1);
  };

  useEffect(() => {
    if (!autoCycleSeason || reducedMotion) return;

    const id = window.setInterval(() => {
      setSeason((current) => (current === "summer" ? "winter" : "summer"));
    }, SEASON_CYCLE_MS);

    return () => window.clearInterval(id);
  }, [autoCycleSeason, reducedMotion, cycleKey]);

  // Draw the chart in once it scrolls into view (one-way latch so the season
  // auto-cycle remounts don't re-trigger the animation).
  useEffect(() => {
    if (reducedMotion) {
      setDrawn(true);
      return;
    }
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setDrawn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className={`tower-3d__power-profile tower-3d__designer-band${
        drawn ? " is-drawn" : ""
      }`}
      aria-labelledby="tower-power-profile-title"
    >
      <div className="tower-3d__power-profile__inner">
        <header className="tower-3d__power-profile__header">
          <h2 id="tower-power-profile-title" className="tower-3d__below-title">
            Output across the day
          </h2>
          <p className="tower-3d__below-lede">{lede}</p>
        </header>

        <div className="tower-3d__power-profile__legend">
          <span className="tower-3d__power-profile__legend-item tower-3d__power-profile__legend-item--janta">
            Janta tracking
          </span>
          <span className="tower-3d__power-profile__legend-item tower-3d__power-profile__legend-item--trad">
            Fixed solar
          </span>
        </div>

        <div className="tower-3d__power-profile__stage">
          <PowerProfileChart key={season} chart={chart} />
        </div>

        <div className="tower-3d__power-profile__switch">
          <div className="tower-3d__power-profile__season" role="tablist" aria-label="Season">
            {SEASONS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={season === item.id}
                className={`tower-3d__power-profile__season-btn${
                  season === item.id ? " is-active" : ""
                }`}
                onClick={() => selectSeason(item.id)}
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
