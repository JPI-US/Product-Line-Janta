import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  acresAt,
  blocksForAcres,
  formatAcres,
  formatMw,
  SCALE_MAX_MW,
  SCALE_MIN_MW,
  SCALE_PRESETS_MW,
} from "../../data/landScaling";
import { YIELD_COMPARE_COPY } from "./websiteData";
import { SHOW_QUIZ } from "../../config/featureFlags";
import { useWebsiteReducedMotion } from "./useWebsiteReducedMotion";

const copy = YIELD_COMPARE_COPY.scale;
const AUTOPLAY_STEP_MS = 1500;

/**
 * Eased follow: the acres readouts count toward their target on preset jumps and
 * glide smoothly with the slider, without re-triggering an animation each change.
 */
function useTweenedNumber(target: number, active: boolean): number {
  const [display, setDisplay] = useState(active ? 0 : target);
  const raf = useRef(0);
  const cur = useRef(display);

  useEffect(() => {
    if (!active) {
      cur.current = target;
      setDisplay(target);
      return;
    }
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const next = cur.current + (target - cur.current) * Math.min(1, dt * 6);
      cur.current = Math.abs(target - next) < 0.03 ? target : next;
      setDisplay(cur.current);
      if (cur.current !== target) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, active]);

  return display;
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
    setMw(value);
  }

  const active = visible && !reducedMotion;
  const target = acresAt(mw);
  const tradAcres = useTweenedNumber(target.traditional, active);
  const jantaAcres = useTweenedNumber(target.janta, active);
  const saved = Math.max(0, tradAcres - jantaAcres);
  const fields = Math.round(saved / 1.32);

  return (
    <div className="web-yield-scale">
      <div className="web-yield-scale__head">
        <h3 className="web-yield-scale__heading">{copy.heading}</h3>
        <p className="web-yield-scale__lede">{copy.lede}</p>
      </div>

      <div className="web-yield-scale__stage">
        <div className="web-yield-scale__side web-yield-scale__side--traditional">
          <div className="web-yield-scale__side-top">
            <span className="web-yield-scale__side-label">{copy.traditionalLabel}</span>
            <span className="web-yield-scale__acres">
              {formatAcres(tradAcres)}
              <span className="web-yield-scale__acres-unit"> {copy.acresUnit}</span>
            </span>
          </div>
          <FootprintGrid count={blocksForAcres(tradAcres)} variant="traditional" />
        </div>

        <div className="web-yield-scale__side web-yield-scale__side--janta">
          <div className="web-yield-scale__side-top">
            <span className="web-yield-scale__side-label">{copy.jantaLabel}</span>
            <span className="web-yield-scale__acres">
              {formatAcres(jantaAcres)}
              <span className="web-yield-scale__acres-unit"> {copy.acresUnit}</span>
            </span>
          </div>
          <FootprintGrid count={blocksForAcres(jantaAcres)} variant="janta" />
        </div>
      </div>

      <p className="web-yield-scale__anchor" aria-live="polite">
        <strong>{formatAcres(saved)} acres saved</strong>
        <span className="web-yield-scale__anchor-sub">
          {" "}
          — about {fields} football {fields === 1 ? "field" : "fields"}
        </span>
      </p>

      <div className="web-yield-scale__controls">
        <div
          className="web-yield-scale__chips"
          role="group"
          aria-label="Project size presets"
        >
          {SCALE_PRESETS_MW.map((preset) => (
            <button
              key={preset}
              type="button"
              className={
                mw === preset
                  ? "web-yield-scale__chip web-yield-scale__chip--active"
                  : "web-yield-scale__chip"
              }
              aria-pressed={mw === preset}
              onClick={() => takeControl(preset)}
            >
              {formatMw(preset)} MW
            </button>
          ))}
        </div>

        <label className="web-yield-scale__slider">
          <span className="visually-hidden">Project size in megawatts</span>
          <input
            type="range"
            min={SCALE_MIN_MW}
            max={SCALE_MAX_MW}
            step={0.1}
            value={mw}
            aria-valuetext={`${formatMw(mw)} megawatts`}
            onChange={(e) => takeControl(Number(e.target.value))}
          />
        </label>

        <span className="web-yield-scale__current" aria-hidden>
          {formatMw(mw)} MW
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
