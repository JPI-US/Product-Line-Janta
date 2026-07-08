import { memo, useMemo } from "react";
import { PORTAL_BAR_STAGGER_MS, PORTAL_ENTER_EASE, PORTAL_ENTER_MS } from "./usePortalEnterAnim";
import { PORTAL_LIGHT_THEME, chartYScale, formatHourLong } from "./marketingDashboardUtils";

type Props = {
  hours: number[];
  powerByHour: number[];
  currentHour: number;
  expanded: boolean;
  motion: boolean;
};

const W = 480;
const H = 200;
const PAD = { l: 36, r: 12, t: 16, b: 28 };

export const PortalPowerChart = memo(function PortalPowerChart({
  hours,
  powerByHour,
  currentHour,
  expanded,
  motion,
}: Props) {
  const values = useMemo(() => hours.map((h) => powerByHour[h] ?? 0), [hours, powerByHour]);

  const yMax = useMemo(() => {
    const peak = values.length ? Math.max(...values) : 0.001;
    return chartYScale(Math.max(peak, 0.001)).max;
  }, [values]);

  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const barW = plotW / Math.max(hours.length, 1);
  const gap = barW * 0.12;

  const yTicks = useMemo(() => {
    const { step } = chartYScale(yMax);
    const ticks: number[] = [];
    for (let v = 0; v <= yMax + step * 0.01; v += step) ticks.push(Math.round(v * 100) / 100);
    return ticks;
  }, [yMax]);

  const labelHours = useMemo(() => {
    if (hours.length < 2) return [];
    return [hours[0], hours[Math.floor(hours.length / 2)], hours[hours.length - 1]];
  }, [hours]);

  return (
    <svg className="web-janta-os-dashboard__portal-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      {yTicks.map((tick) => {
        const y = PAD.t + plotH * (1 - tick / yMax);
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

      {values.map((kw, i) => {
        const h = hours[i];
        const height = (kw / yMax) * plotH;
        const x = PAD.l + i * barW + gap / 2;
        const w = barW - gap;
        const y = PAD.t + plotH - height;
        const isCurrent = h === currentHour;
        const hasPower = kw > 0;
        const fill = isCurrent
          ? PORTAL_LIGHT_THEME.amber
          : hasPower
            ? "rgba(232,160,32,0.52)"
            : "rgba(232,160,32,0.14)";
        const stagger = expanded
          ? i * PORTAL_BAR_STAGGER_MS
          : (values.length - 1 - i) * PORTAL_BAR_STAGGER_MS;
        const barTransition = motion
          ? `y ${PORTAL_ENTER_MS}ms ${PORTAL_ENTER_EASE} ${stagger}ms, height ${PORTAL_ENTER_MS}ms ${PORTAL_ENTER_EASE} ${stagger}ms, fill 520ms ease`
          : "none";

        return (
          <rect
            key={h}
            x={x}
            y={expanded ? y : PAD.t + plotH}
            width={w}
            height={expanded ? Math.max(height, 0) : 0}
            rx={3}
            fill={fill}
            style={{ transition: barTransition }}
          />
        );
      })}

      {labelHours.map((hour) => {
        const idx = hours.indexOf(hour);
        if (idx < 0) return null;
        const x = PAD.l + idx * barW + barW / 2;
        return (
          <text
            key={hour}
            x={x}
            y={H - 6}
            textAnchor="middle"
            fill={PORTAL_LIGHT_THEME.text3}
            fontSize={11}
          >
            {formatHourLong(hour)}
          </text>
        );
      })}

      <text x={8} y={PAD.t + 8} fill={PORTAL_LIGHT_THEME.text3} fontSize={11} fontWeight={500}>
        kW
      </text>
    </svg>
  );
});
