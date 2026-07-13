import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  acresAt,
  annualMwhAt,
  blocksForAcres,
  clampScaleMw,
  formatAcres,
  formatMw,
  formatMwh,
  SCALE_MAX_MW,
  SCALE_MIN_MW,
  SCALE_PRESETS_MW,
} from "../../data/landScaling";
import { YIELD_COMPARE_COPY } from "./websiteData";
import { SHOW_QUIZ } from "../../config/featureFlags";
import { useWebsiteReducedMotion } from "./useWebsiteReducedMotion";

const copy = YIELD_COMPARE_COPY.scale;
const AUTOPLAY_STEP_MS = 1500;
const PHRASE_CYCLE_MS = 3400;
const PHRASE_TRANSITION_MS = 480;

/** "1 acre" vs "2 acres" — the readout rounds, so pluralise off the rounded value. */
function acreUnit(acres: number): string {
  return Math.round(Math.max(0, acres)) === 1 ? "acre" : "acres";
}

function floorMetric(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** Renders a phrase, giving the `*starred*` words the gradient highlight. */
function renderPhrase(phrase: string) {
  return phrase
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith("*") && part.endsWith("*") ? (
        <span key={i} className="web-yield-scale__cycle-em">
          {part.slice(1, -1)}
        </span>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    );
}

/**
 * Cycles the emphasised second line of the heading ("A fraction of the land." →
 * "More energy."). Hidden sizers reserve the tallest phrase so the heading never
 * reflows mid-swap. Only the starred words carry the "Where Janta Shines" gradient.
 */
function CyclingHeadline({ phrases }: { phrases: readonly string[] }) {
  const reducedMotion = useWebsiteReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (reducedMotion || phrases.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((current) => {
        setPrevIndex(current);
        return (current + 1) % phrases.length;
      });
    }, PHRASE_CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, phrases.length]);

  useEffect(() => {
    if (prevIndex === null) return;
    const id = window.setTimeout(() => setPrevIndex(null), PHRASE_TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [prevIndex, activeIndex]);

  const activePhrase = phrases[activeIndex] ?? phrases[0];
  const prevPhrase = prevIndex !== null ? phrases[prevIndex] : null;

  return (
    <span className="web-yield-scale__heading-accent">
      <span className="web-yield-scale__cycle-track">
        {phrases.map((phrase) => (
          <span key={`sizer-${phrase}`} className="web-yield-scale__cycle-sizer" aria-hidden>
            {renderPhrase(phrase)}
          </span>
        ))}
        {prevPhrase && ready ? (
          <span className="web-yield-scale__cycle-word is-exit" aria-hidden>
            {renderPhrase(prevPhrase)}
          </span>
        ) : null}
        <span
          key={activeIndex}
          className={`web-yield-scale__cycle-word is-active${
            ready && prevPhrase ? " is-entering" : ""
          }`}
        >
          {renderPhrase(activePhrase)}
        </span>
      </span>
    </span>
  );
}

/**
 * Eased follow: the acres readouts count toward their target on preset jumps and
 * glide smoothly with the slider, without re-triggering an animation each change.
 */
function useTweenedNumber(target: number, active: boolean): number {
  const safeTarget = floorMetric(target);
  const [display, setDisplay] = useState(active ? 0 : safeTarget);
  const raf = useRef(0);
  const cur = useRef(display);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (!active) {
      cur.current = safeTarget;
      setDisplay(safeTarget);
      return;
    }
    let cancelled = false;
    let last = performance.now();
    const tick = (now: number) => {
      if (cancelled) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const next = floorMetric(cur.current + (safeTarget - cur.current) * Math.min(1, dt * 6));
      cur.current = Math.abs(safeTarget - next) < 0.03 ? safeTarget : next;
      setDisplay(cur.current);
      if (cur.current !== safeTarget) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf.current);
    };
  }, [safeTarget, active]);

  return floorMetric(display);
}

function FootprintGrid({
  count,
  variant,
}: {
  count: number;
  variant: "traditional" | "janta";
}) {
  return (
    <div
      className={`web-yield-scale__grid web-yield-scale__grid--${variant}`}
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="web-yield-scale__block" />
      ))}
    </div>
  );
}

/** Scaling "land story": auto-plays 0.5→10 MW on scroll-in, then hands over
 *  chips + a slider. Land is shown as diverging footprint-block grids. */
export function WebsiteYieldScaleStory({ visible }: { visible: boolean }) {
  const reducedMotion = useWebsiteReducedMotion();
  const [mw, setMw] = useState<number>(reducedMotion ? SCALE_MAX_MW : SCALE_PRESETS_MW[0]);
  const [autoplaying, setAutoplaying] = useState(!reducedMotion);
  const safeMw = clampScaleMw(mw);

  // Step through the presets while auto-playing, ending at the widest gap.
  useEffect(() => {
    if (!visible || !autoplaying || reducedMotion) return;
    let idx = SCALE_PRESETS_MW.indexOf(mw as (typeof SCALE_PRESETS_MW)[number]);
    if (idx < 0) idx = 0;
    if (idx >= SCALE_PRESETS_MW.length - 1) {
      setAutoplaying(false);
      return;
    }
    const id = window.setTimeout(() => setMw(SCALE_PRESETS_MW[idx + 1]), AUTOPLAY_STEP_MS);
    return () => window.clearTimeout(id);
  }, [visible, autoplaying, mw, reducedMotion]);

  // First interaction hands the controls to the visitor for good.
  function takeControl(value: number) {
    setAutoplaying(false);
    setMw(clampScaleMw(value));
  }

  const active = visible && !reducedMotion;
  const target = acresAt(safeMw);
  const energy = annualMwhAt(safeMw);
  const tradAcres = useTweenedNumber(target.traditional, active);
  const jantaAcres = useTweenedNumber(target.janta, active);
  const tradMwh = useTweenedNumber(energy.traditional, active);
  const jantaMwh = useTweenedNumber(energy.janta, active);
  const saved = floorMetric(tradAcres - jantaAcres);
  const fields = Math.round(saved / 1.32);

  return (
    <div className="web-yield-scale">
      <div className="web-yield-scale__head">
        <h2 id="web-yield-compare-title" className="web-yield-scale__heading">
          {copy.heading}
          <CyclingHeadline phrases={copy.headingAccentPhrases} />
        </h2>
        <p className="web-yield-scale__lede">{copy.lede}</p>
      </div>

      <div className="web-yield-scale__stage">
        <div className="web-yield-scale__side web-yield-scale__side--traditional">
          <div className="web-yield-scale__side-top">
            <span className="web-yield-scale__side-label">{copy.traditionalLabel}</span>
            <span className="web-yield-scale__acres">
              {formatAcres(tradAcres)}
              <span className="web-yield-scale__acres-unit"> {acreUnit(tradAcres)}</span>
            </span>
          </div>
          <FootprintGrid count={blocksForAcres(tradAcres)} variant="traditional" />
          <p className="web-yield-scale__energy">
            <span className="web-yield-scale__energy-label">Annual energy</span>
            <span className="web-yield-scale__energy-value">
              {formatMwh(tradMwh)} <span className="web-yield-scale__energy-unit">MWh</span>
            </span>
          </p>
        </div>

        <div className="web-yield-scale__side web-yield-scale__side--janta">
          <div className="web-yield-scale__side-top">
            <span className="web-yield-scale__side-label">{copy.jantaLabel}</span>
            <span className="web-yield-scale__acres">
              {formatAcres(jantaAcres)}
              <span className="web-yield-scale__acres-unit"> {acreUnit(jantaAcres)}</span>
            </span>
          </div>
          <FootprintGrid count={blocksForAcres(jantaAcres)} variant="janta" />
          <p className="web-yield-scale__energy">
            <span className="web-yield-scale__energy-label">Annual energy</span>
            <span className="web-yield-scale__energy-value web-yield-scale__energy-value--janta">
              {formatMwh(jantaMwh)} <span className="web-yield-scale__energy-unit">MWh</span>
            </span>
          </p>
        </div>
      </div>

      <p className="web-yield-scale__anchor" aria-live="polite">
        <strong>
          {formatAcres(saved)} {acreUnit(saved)} saved
        </strong>
        <span className="web-yield-scale__anchor-sub">
          {" "}
          — about {fields} football {fields === 1 ? "field" : "fields"}
        </span>
      </p>

      <div className="web-yield-scale__controls">
        <label className="web-yield-scale__slider">
          <span className="visually-hidden">Project size in megawatts</span>
          <input
            type="range"
            min={SCALE_MIN_MW}
            max={SCALE_MAX_MW}
            step={0.1}
            value={safeMw}
            aria-valuetext={`${formatMw(safeMw)} megawatts`}
            onChange={(e) => takeControl(Number(e.target.value))}
          />
        </label>

        <span className="web-yield-scale__current" aria-hidden>
          {formatMw(safeMw)} MW
        </span>
      </div>

      <Link
        className="web-yield-scale__cta"
        to={SHOW_QUIZ ? "/quiz" : "/contact"}
      >
        {copy.ctaLabel}
        <span aria-hidden> →</span>
      </Link>
    </div>
  );
}
