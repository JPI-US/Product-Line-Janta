import { memo, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { EnergyChartPoint } from "./marketingMockData";
import { PORTAL_ENTER_EASE, PORTAL_ENTER_MS } from "./usePortalEnterAnim";
import { PORTAL_LIGHT_THEME, chartYScale, formatHourLong } from "./marketingDashboardUtils";

type Props = {
  points: EnergyChartPoint[];
  currentHour: number;
  expanded: boolean;
  motion: boolean;
};

const W = 480;
const H = 200;
const PAD = { l: 36, r: 12, t: 16, b: 28 };

function chartHourX(index: number, count: number) {
  const plotW = W - PAD.l - PAD.r;
  return PAD.l + (index + 0.5) * (plotW / Math.max(count, 1));
}

function buildPaths(points: EnergyChartPoint[], yMax: number) {
  if (!points.length) return { line: "", area: "", coords: [] as { x: number; y: number }[] };

  const plotH = H - PAD.t - PAD.b;

  const coords = points.map((p, i) => {
    const x = chartHourX(i, points.length);
    const y = PAD.t + plotH - (p.y / yMax) * plotH;
    return { x, y };
  });

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];
  const first = coords[0];
  const baseY = H - PAD.b;
  const area = `${line} L ${last.x.toFixed(1)} ${baseY} L ${first.x.toFixed(1)} ${baseY} Z`;

  return { line, area, coords };
}

export const PortalEnergyChart = memo(function PortalEnergyChart({
  points,
  currentHour,
  expanded,
  motion,
}: Props) {
  const lineRef = useRef<SVGPathElement>(null);
  const [pathLen, setPathLen] = useState(0);

  const yMax = useMemo(() => {
    const peak = points.length ? Math.max(...points.map((p) => p.y)) : 0.001;
    return chartYScale(Math.max(peak, 0.001)).max;
  }, [points]);

  const { line, area, coords } = useMemo(() => buildPaths(points, yMax), [points, yMax]);

  const currentIdx = useMemo(
    () => points.findIndex((p) => p.hour === currentHour),
    [points, currentHour],
  );

  const marker = currentIdx >= 0 ? coords[currentIdx] : null;
  const plotH = H - PAD.t - PAD.b;
  const baseY = PAD.t + plotH;

  useLayoutEffect(() => {
    if (lineRef.current) {
      setPathLen(lineRef.current.getTotalLength());
    }
  }, [line]);

  const yTicks = useMemo(() => {
    const { step } = chartYScale(yMax);
    const ticks: number[] = [];
    for (let v = 0; v <= yMax + step * 0.01; v += step) ticks.push(Math.round(v * 100) / 100);
    return ticks;
  }, [yMax]);

  const xLabels = useMemo(() => {
    if (points.length < 2) return [];
    const first = points[0].hour;
    const mid = points[Math.floor(points.length / 2)].hour;
    const last = points[points.length - 1].hour;
    return [
      { hour: first, label: formatHourLong(first) },
      { hour: mid, label: formatHourLong(mid) },
      { hour: last, label: formatHourLong(last) },
    ];
  }, [points]);

  const lineTransition = motion
    ? `stroke-dashoffset ${PORTAL_ENTER_MS}ms ${PORTAL_ENTER_EASE}`
    : "none";
  const markerTransition = motion ? "cx 520ms ease, cy 520ms ease" : "none";

  return (
    <svg className="web-janta-os-dashboard__portal-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="portal-energy-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PORTAL_LIGHT_THEME.amberDim} />
          <stop offset="100%" stopColor="rgba(232,160,32,0)" />
        </linearGradient>
      </defs>

      {yTicks.map((tick) => {
        const y = PAD.t + (H - PAD.t - PAD.b) * (1 - tick / yMax);
        return (
          <line
            key={tick}
            x1={PAD.l}
            x2={W - PAD.r}
            y1={y}
            y2={y}
            stroke={PORTAL_LIGHT_THEME.chartGrid}
            strokeWidth={0.5}
          />
        );
      })}

      <path
        className="web-janta-os-dashboard__portal-area"
        d={area}
        fill="url(#portal-energy-fill)"
        style={{
          opacity: expanded ? 1 : 0,
          transition: motion ? `opacity ${PORTAL_ENTER_MS}ms ${PORTAL_ENTER_EASE}` : "none",
        }}
      />
      <path
        ref={lineRef}
        className="web-janta-os-dashboard__portal-line"
        d={line}
        fill="none"
        stroke={PORTAL_LIGHT_THEME.amber}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLen || undefined}
        strokeDashoffset={expanded ? 0 : pathLen}
        style={{ transition: lineTransition }}
      />

      {marker ? (
        <g className="web-janta-os-dashboard__portal-marker">
          <circle
            cx={marker.x}
            cy={expanded ? marker.y : baseY}
            r={7}
            fill="none"
            stroke={PORTAL_LIGHT_THEME.amber}
            strokeWidth={1}
            strokeOpacity={expanded ? 0.38 : 0}
            style={{ transition: markerTransition }}
          />
          <circle
            cx={marker.x}
            cy={expanded ? marker.y : baseY}
            r={4}
            fill={PORTAL_LIGHT_THEME.amber}
            stroke="#ffffff"
            strokeWidth={1.5}
            fillOpacity={expanded ? 1 : 0}
            style={{ transition: `${markerTransition}, fill-opacity 320ms ease` }}
          />
        </g>
      ) : null}

      {xLabels.map(({ hour, label }) => {
        const idx = points.findIndex((p) => p.hour === hour);
        if (idx < 0) return null;
        const x = chartHourX(idx, points.length);
        return (
          <text
            key={hour}
            x={x}
            y={H - 6}
            textAnchor="middle"
            fill={PORTAL_LIGHT_THEME.text3}
            fontSize={11}
          >
            {label}
          </text>
        );
      })}

      <text x={8} y={PAD.t + 8} fill={PORTAL_LIGHT_THEME.text3} fontSize={11} fontWeight={500}>
        kWh
      </text>
    </svg>
  );
});
