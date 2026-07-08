import { useEffect, useRef, useState } from "react";
import {
  freezeWebsiteBelowScrollLayout,
  unfreezeWebsiteBelowScrollLayout,
} from "./websiteBelowScrollMeasure";

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

type WebsiteAnimatedStatProps = {
  end: number;
  prefix?: string;
  suffix: string;
  replayKey?: number;
};

export function WebsiteAnimatedStat({
  end,
  prefix = "",
  suffix,
  replayKey = 0,
}: WebsiteAnimatedStatProps) {
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);
  const rafRef = useRef(0);

  const finalDisplay = Number.isInteger(end)
    ? String(end)
    : end.toFixed(1);

  useEffect(() => {
    if (replayKey <= 0) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      setValue(end);
      setDone(true);
      return;
    }

    const stopAnimation = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };

    stopAnimation();
    freezeWebsiteBelowScrollLayout();
    setValue(0);
    setDone(false);

    const duration = 1500;
    const startAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startAt;
      if (elapsed < 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      setValue(end * eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
        setValue(end);
        setDone(true);
        unfreezeWebsiteBelowScrollLayout();
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      stopAnimation();
      unfreezeWebsiteBelowScrollLayout();
    };
  }, [end, replayKey]);

  const display = Number.isInteger(end)
    ? String(Math.round(value))
    : value.toFixed(1);

  return (
    <span
      className={`web-stat__value${done ? " web-stat__value--done" : ""}`}
      aria-hidden
    >
      <span className="web-stat__value-sizer" aria-hidden>
        <span className="web-stat__prefix">{prefix}</span>
        <span className="web-stat__number">{finalDisplay}</span>
        <span className="web-stat__suffix">{suffix}</span>
      </span>
      <span className="web-stat__value-live">
        <span className="web-stat__prefix">{prefix}</span>
        <span className="web-stat__number">{display}</span>
        <span className="web-stat__suffix">{suffix}</span>
      </span>
    </span>
  );
}
