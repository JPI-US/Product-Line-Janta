import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import { PortalEnergyChart } from "./portal-showcase/PortalEnergyChart";
import { PortalPowerChart } from "./portal-showcase/PortalPowerChart";
import {
  HEALTH_COMPONENTS,
  PORTAL_LIGHT_THEME,
  WEATHER_UI,
  getTowerDirection,
} from "./portal-showcase/marketingDashboardUtils";
import { useMarketingShowcaseDashboard } from "./portal-showcase/useMarketingShowcaseDashboard";
import { PORTAL_ENTER_EASE, PORTAL_STATUS_ENTER_MS, usePortalEnterAnim } from "./portal-showcase/usePortalEnterAnim";
import "./websiteJantaOsDashboard.css";

type Props = {
  active: boolean;
  animate: boolean;
};

const GAUGE_RING_R = 54;
const TOWER_RING_R = 58;
const RING_VIEW = 120;
const RING_CENTER = RING_VIEW / 2;
const GAUGE_CIRC = 2 * Math.PI * GAUGE_RING_R;
const TOWER_CIRC = 2 * Math.PI * TOWER_RING_R;
const TOWER_DOT_COUNT = Math.round(TOWER_CIRC / 9);
const TOWER_DOT_R = 1.5;
const KW_UPDATE_MS = 480;

const TOWER_RING_DOTS = Array.from({ length: TOWER_DOT_COUNT }, (_, i) => {
  const angle = (i / TOWER_DOT_COUNT) * Math.PI * 2 - Math.PI / 2;
  return {
    x: RING_CENTER + TOWER_RING_R * Math.cos(angle),
    y: RING_CENTER + TOWER_RING_R * Math.sin(angle),
  };
});

function easeOutQuart(t: number) {
  return 1 - (1 - t) ** 4;
}

/** Portal Marketing system dashboard — self-contained showcase fork */
export const WebsiteJantaOsDashboard = memo(function WebsiteJantaOsDashboard({ active, animate }: Props) {
  const gaugeRef = useRef<SVGCircleElement>(null);

  const {
    weather,
    pvPowerKw,
    powerPercent,
    energyChartPoints,
    chartHours,
    powerByHour,
    currentHour,
    towerAngle,
  } = useMarketingShowcaseDashboard(active);

  const { expanded, motion, exiting } = usePortalEnterAnim(animate);
  const kwEnterDoneRef = useRef(false);
  const kwAnimRef = useRef(0);
  const kwRafRef = useRef(0);

  const [gaugeDraw, setGaugeDraw] = useState(0);
  const [towerDotsVisible, setTowerDotsVisible] = useState(0);
  const [kwDisplay, setKwDisplay] = useState(0);
  const [liveMetricsReady, setLiveMetricsReady] = useState(false);

  const towerDirection = getTowerDirection(towerAngle);
  const gaugeVisible = gaugeDraw * GAUGE_CIRC;
  const condition = weather.current.condition;
  const weatherDisplay = WEATHER_UI[condition] ?? WEATHER_UI.default;
  const gaugeTransitionMs = liveMetricsReady ? KW_UPDATE_MS + 180 : PORTAL_STATUS_ENTER_MS;

  useEffect(() => {
    if (!motion && !expanded) {
      kwEnterDoneRef.current = false;
      setLiveMetricsReady(false);
      setGaugeDraw(0);
      setTowerDotsVisible(0);
      setKwDisplay(0);
      kwAnimRef.current = 0;
      return;
    }

    const target = expanded ? powerPercent : 0;
    const id = window.requestAnimationFrame(() => {
      setGaugeDraw(target);
    });

    return () => window.cancelAnimationFrame(id);
  }, [expanded, motion, powerPercent]);

  useEffect(() => {
    if (!motion && !expanded) {
      setTowerDotsVisible(0);
      return;
    }

    if (expanded) {
      let dot = 0;
      setTowerDotsVisible(0);
      const msPerDot = PORTAL_STATUS_ENTER_MS / TOWER_DOT_COUNT;
      const timer = window.setInterval(() => {
        dot += 1;
        setTowerDotsVisible(dot);
        if (dot >= TOWER_DOT_COUNT) window.clearInterval(timer);
      }, msPerDot);

      return () => window.clearInterval(timer);
    }

    let dot = TOWER_DOT_COUNT;
    setTowerDotsVisible(dot);
    const msPerDot = PORTAL_STATUS_ENTER_MS / TOWER_DOT_COUNT;
    const timer = window.setInterval(() => {
      dot -= 1;
      setTowerDotsVisible(Math.max(dot, 0));
      if (dot <= 0) window.clearInterval(timer);
    }, msPerDot);

    return () => window.clearInterval(timer);
  }, [expanded, motion]);

  useEffect(() => {
    if (!motion && !expanded) return;

    window.cancelAnimationFrame(kwRafRef.current);

    const from = kwAnimRef.current;
    const target = expanded ? pvPowerKw : 0;
    const duration = expanded
      ? kwEnterDoneRef.current
        ? KW_UPDATE_MS
        : PORTAL_STATUS_ENTER_MS
      : PORTAL_STATUS_ENTER_MS;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const value = from + (target - from) * easeOutQuart(t);
      kwAnimRef.current = value;
      setKwDisplay(value);
      if (t < 1) {
        kwRafRef.current = window.requestAnimationFrame(tick);
      } else {
        kwAnimRef.current = target;
        setKwDisplay(target);
        if (expanded) {
          kwEnterDoneRef.current = true;
          setLiveMetricsReady(true);
        } else {
          kwEnterDoneRef.current = false;
          setLiveMetricsReady(false);
        }
      }
    };

    kwRafRef.current = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(kwRafRef.current);
  }, [expanded, motion, pvPowerKw]);

  useEffect(() => {
    if (!active) return;

    if (gaugeRef.current) {
      gaugeRef.current.style.strokeDasharray = `${gaugeVisible} ${GAUGE_CIRC}`;
    }
  }, [active, gaugeVisible]);

  const rootClass = [
    "web-janta-os-dashboard",
    "web-janta-os-dashboard--showcase",
    active && "web-janta-os-dashboard--active",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} aria-hidden>
      <nav className="web-janta-os-dashboard__nav" aria-hidden>
        <button type="button" className="web-janta-os-dashboard__nav-btn web-janta-os-dashboard__nav-btn--active">
          <span className="web-janta-os-dashboard__nav-icon web-janta-os-dashboard__nav-icon--grid" />
        </button>
        <button type="button" className="web-janta-os-dashboard__nav-btn">
          <span className="web-janta-os-dashboard__nav-icon web-janta-os-dashboard__nav-icon--chart" />
        </button>
        <button type="button" className="web-janta-os-dashboard__nav-btn">
          <span className="web-janta-os-dashboard__nav-icon web-janta-os-dashboard__nav-icon--sliders" />
        </button>
        <button type="button" className="web-janta-os-dashboard__nav-btn">
          <span className="web-janta-os-dashboard__nav-icon web-janta-os-dashboard__nav-icon--history" />
        </button>
      </nav>

      <div className="web-janta-os-dashboard__main">
        <header className="web-janta-os-dashboard__top web-janta-os-dashboard__top--showcase">
          <div className="web-janta-os-dashboard__top-spacer" aria-hidden />
          <div className="web-janta-os-dashboard__top-right">
            <span className="web-janta-os-dashboard__top-icon-btn" aria-hidden>
              <span className="web-janta-os-dashboard__theme-icon" />
            </span>
            <span className="web-janta-os-dashboard__top-icon-btn" aria-hidden>
              <span className="web-janta-os-dashboard__menu-icon" />
            </span>
          </div>
        </header>

        <div className="web-janta-os-dashboard__content">
          <div className="web-janta-os-dashboard__status-row">
            <article className="web-janta-os-dashboard__portal-card">
              <div className="web-janta-os-dashboard__portal-card-head">
                <p>Power Output</p>
              </div>
              <div className="web-janta-os-dashboard__portal-card-body web-janta-os-dashboard__portal-card-body--center">
                <div className="web-janta-os-dashboard__ring-slot">
                  <div className="web-janta-os-dashboard__gauge-portal web-janta-os-dashboard__ring-visual">
                    <div className="web-janta-os-dashboard__gauge-portal-center">
                      <span className="web-janta-os-dashboard__gauge-portal-kw">
                        {kwDisplay.toFixed(2)}
                      </span>
                      <span className="web-janta-os-dashboard__gauge-portal-unit">kilowatts</span>
                    </div>
                    <svg viewBox={`0 0 ${RING_VIEW} ${RING_VIEW}`} aria-hidden>
                      <circle
                        cx={RING_CENTER}
                        cy={RING_CENTER}
                        r={GAUGE_RING_R}
                        fill="transparent"
                        stroke={PORTAL_LIGHT_THEME.gaugeTrack}
                        strokeWidth={6}
                      />
                      <circle
                        ref={gaugeRef}
                        cx={RING_CENTER}
                        cy={RING_CENTER}
                        r={GAUGE_RING_R}
                        fill="transparent"
                        stroke={PORTAL_LIGHT_THEME.gaugeRing}
                        strokeWidth={6}
                        strokeDasharray={`${gaugeVisible} ${GAUGE_CIRC}`}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
                      style={{
                        transition: motion
                          ? `stroke-dasharray ${gaugeTransitionMs}ms ${PORTAL_ENTER_EASE}`
                          : "none",
                      }}
                      />
                    </svg>
                  </div>
                </div>
                <div className="web-janta-os-dashboard__conditions">
                  <p className="web-janta-os-dashboard__conditions-value">
                    {weatherDisplay.icon} {weatherDisplay.title}
                  </p>
                </div>
              </div>
            </article>

            <article className="web-janta-os-dashboard__portal-card">
              <div className="web-janta-os-dashboard__portal-card-head">
                <p>Tower Angle</p>
              </div>
              <div className="web-janta-os-dashboard__portal-card-body web-janta-os-dashboard__portal-card-body--center">
                <div className="web-janta-os-dashboard__ring-slot">
                  <div className="web-janta-os-dashboard__tower-visual web-janta-os-dashboard__ring-visual web-janta-os-dashboard__tower-visual--showcase">
                    <svg viewBox={`0 0 ${RING_VIEW} ${RING_VIEW}`} aria-hidden>
                      {TOWER_RING_DOTS.map((dot, i) => (
                        <circle
                          key={i}
                          className="web-janta-os-dashboard__tower-dot"
                          cx={dot.x}
                          cy={dot.y}
                          r={TOWER_DOT_R}
                          fill={PORTAL_LIGHT_THEME.amber}
                          opacity={i < towerDotsVisible ? 0.85 : 0}
                          transform={i < towerDotsVisible ? "scale(1)" : "scale(0.35)"}
                        />
                      ))}
                    </svg>
                    <img
                      src="/marketing/portal/tower_Design.svg"
                      alt=""
                      className="web-janta-os-dashboard__tower-img"
                      decoding="async"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="web-janta-os-dashboard__conditions">
                  <p className="web-janta-os-dashboard__conditions-value">{towerDirection}</p>
                </div>
              </div>
            </article>

            <article className="web-janta-os-dashboard__portal-card web-janta-os-dashboard__portal-card--health">
              <div className="web-janta-os-dashboard__portal-card-body web-janta-os-dashboard__portal-card-body--health">
                <div
                  className={[
                    "web-janta-os-dashboard__health-list",
                    expanded && motion && "web-janta-os-dashboard__health-list--animate",
                    exiting && "web-janta-os-dashboard__health-list--exit",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="web-janta-os-dashboard__health-list-row web-janta-os-dashboard__health-list-row--title">
                    <span className="web-janta-os-dashboard__health-list-label">System Health</span>
                    <span
                      className="web-janta-os-dashboard__health-dot"
                      style={{ "--health-dot-i": 0 } as CSSProperties}
                      aria-hidden
                    />
                  </div>
                  {HEALTH_COMPONENTS.map((item, index) => (
                    <div key={item} className="web-janta-os-dashboard__health-list-row">
                      <span className="web-janta-os-dashboard__health-list-label">{item}</span>
                      <span
                        className="web-janta-os-dashboard__health-dot"
                        style={{ "--health-dot-i": index + 1 } as CSSProperties}
                        aria-hidden
                      />
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>

          <div className="web-janta-os-dashboard__glance-row">
            <article className="web-janta-os-dashboard__portal-card">
              <div className="web-janta-os-dashboard__portal-card-head">
                <p>Energy Output</p>
              </div>
              <div className="web-janta-os-dashboard__portal-card-body web-janta-os-dashboard__portal-card-body--chart">
                <PortalEnergyChart
                  points={energyChartPoints}
                  currentHour={currentHour}
                  expanded={expanded}
                  motion={motion}
                />
              </div>
            </article>

            <article className="web-janta-os-dashboard__portal-card">
              <div className="web-janta-os-dashboard__portal-card-head">
                <p>Power Output</p>
              </div>
              <div className="web-janta-os-dashboard__portal-card-body web-janta-os-dashboard__portal-card-body--chart">
                <PortalPowerChart
                  hours={chartHours}
                  powerByHour={powerByHour}
                  currentHour={currentHour}
                  expanded={expanded}
                  motion={motion}
                />
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
});
