import { partnerLogos } from "@/lib/assets";
import { HERO_TOWER_POSE } from "@/lib/heroTowerPose";
import { HERO_COPY } from "@/marketing/website/websiteData";
import { Fragment, Suspense, lazy, useEffect, useRef, useState } from "react";

// Lazy so the ~1.25 MB three.js bundle is only fetched when the live tower
// actually renders — i.e. on desktop. Phones get the static poster instead and
// never download it.
const Tower3D = lazy(() =>
  import("./Tower3D").then((m) => ({ default: m.Tower3D })),
);

const HERO_HEADING_LINES = ["More Power.", "Less Land."] as const;

/** True on phone-sized screens — kept in sync so a resize swaps poster ↔ 3D. */
function useIsMobile() {
  const query = "(max-width: 820px)";
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

/** Pre-rendered tower — instant paint, and the only tower phones ever load. */
function HeroTowerPoster({ decorative = false }: { decorative?: boolean }) {
  return (
    <img
      className="hero-tower-poster"
      src="/hero-tower.png"
      width={760}
      height={962}
      alt={decorative ? "" : "Janta Power vertical 3D solar tower"}
      aria-hidden={decorative || undefined}
      decoding="async"
    />
  );
}

/** Phones: no tower visual for now (removed per mobile polish). Desktop: live
 * 3D, poster as the Suspense fallback. */
function HeroTower() {
  const isMobile = useIsMobile();
  if (isMobile) return null;
  return (
    <Suspense fallback={<HeroTowerPoster decorative />}>
      <Tower3D
        variant="designer"
        interactive
        autoRotateSpeed={0.32}
        sweepDeg={90}
        modelScale={0.85}
        initialRotationY={HERO_TOWER_POSE.initialRotationY}
        cameraPosition={[...HERO_TOWER_POSE.cameraPosition]}
        cameraTarget={[...HERO_TOWER_POSE.cameraTarget]}
        cameraFov={HERO_TOWER_POSE.cameraFov}
        showSky={false}
        showHint={false}
        className="hero-tower-canvas"
        height="100%"
      />
    </Suspense>
  );
}

/** Static heading — renders instantly (no slide-in) so the copy never lags. */
function HeroHeading() {
  return (
    <h1 className="hero-heading">
      {HERO_HEADING_LINES.map((line) => (
        <span key={line} className="hero-heading__line">
          {line}
        </span>
      ))}
    </h1>
  );
}

export function Hero() {
  return (
    <section className="hero-section">
      <div className="container-page hero-grid">
        <div className="hero-copy">
          <HeroHeading />
          <p className="hero-lead">{HERO_COPY.sub}</p>
          <div className="hero-stats-wrap">
            <div className="hero-stats">
              {HERO_COPY.stats.map((stat, index) => (
                <Fragment key={stat.label}>
                  {index > 0 ? <Divider /> : null}
                  <Stat
                    value={stat.value}
                    label={stat.label}
                    prefix={"prefix" in stat ? stat.prefix : undefined}
                  />
                </Fragment>
              ))}
            </div>
            <p className="hero-stats__context">{HERO_COPY.statsContext}</p>
          </div>
        </div>
        <div className="hero-tower-col">
          <div
            aria-hidden
            className="hero-tower-glow"
            style={{
              background:
                "radial-gradient(55% 50% at 50% 55%, rgba(var(--sky-rgb), 0.16), transparent 72%)",
            }}
          />
          <HeroTower />
        </div>
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
  prefix,
}: {
  value: string;
  label: string;
  /** Optional qualifier shown before the number (e.g. "Up to" a capacity factor). */
  prefix?: string;
}) {
  return (
    <div className="hero-stat">
      <div className="hero-stat__value">
        {prefix ? <span className="hero-stat__prefix">{prefix} </span> : null}
        <CountUpValue value={value} />
      </div>
      <div className="hero-stat__label">{label}</div>
    </div>
  );
}

/** Counts a stat up from 0 to its target on load (e.g. "50%", "3X"). */
function CountUpValue({ value }: { value: string }) {
  const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
  const end = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : "";
  const isInteger = Number.isInteger(end);
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!match) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(end);
      return;
    }
    let cancelled = false;
    let idleId = 0;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const run = () => {
      const duration = 1400;
      const startAt = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const progress = Math.min(1, (now - startAt) / duration);
        const eased = 1 - (1 - progress) ** 3;
        setDisplay(end * eased);
        if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    // Start once the main thread is idle — the 3D hero blocks it while
    // initialising, which would otherwise starve the rAF loop and snap the
    // number straight to its final value instead of counting up.
    if (w.requestIdleCallback) {
      idleId = w.requestIdleCallback(run, { timeout: 1600 });
    } else {
      idleId = window.setTimeout(run, 600);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (w.cancelIdleCallback) w.cancelIdleCallback(idleId);
      else clearTimeout(idleId);
    };
    // Re-run only when the source string changes (match/end/suffix derive from it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!match) return <>{value}</>;
  const shown = isInteger ? String(Math.round(display)) : display.toFixed(1);
  return (
    <span className="hero-stat__count">
      <span className="sr-only">{value}</span>
      <span className="hero-stat__count-sizer" aria-hidden>
        {value}
      </span>
      <span className="hero-stat__count-live" aria-hidden>
        {shown}
        {suffix}
      </span>
    </span>
  );
}

const Divider = () => <span className="hero-stat-divider" aria-hidden />;

export function ProofBand() {
  const loop = [...partnerLogos, ...partnerLogos];
  const count = partnerLogos.length;

  return (
    <section className="hero-partners-band" aria-label="Partners">
      <div className="hero-partners-marquee">
        <div className="hero-partners-track anim-marquee">
          {loop.map((p, i) => (
            <span key={`${p.id}-${i}`} className="hero-partners-segment">
              <span className="partner-mark">
                <img
                  className={`partner-logo partner-logo--${p.id}`}
                  src={p.logo}
                  alt={p.name}
                  decoding="async"
                  loading={i >= count ? "lazy" : "eager"}
                />
              </span>
              <span aria-hidden className="partner-diamond" />
            </span>
          ))}
        </div>
      </div>
      <ul className="sr-only">
        {partnerLogos.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </section>
  );
}
