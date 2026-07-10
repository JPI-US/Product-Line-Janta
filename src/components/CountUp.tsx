import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function formatNumber(n: number, decimals: number) {
  const [int, dec] = n.toFixed(decimals).split(".");
  const grouped = Number(int).toLocaleString("en-US");
  return dec ? `${grouped}.${dec}` : grouped;
}

type ParsedValue =
  | {
      kind: "single";
      end: number;
      suffix: string;
      decimals: number;
    }
  | {
      kind: "range";
      endA: number;
      endB: number;
      sep: string;
      suffix: string;
      decimalsA: number;
      decimalsB: number;
    }
  | { kind: "static" };

function parseValue(value: string): ParsedValue {
  const range = value.match(
    /^(\d[\d,]*(?:\.\d+)?)(\s*[–-]\s*)(\d[\d,]*(?:\.\d+)?)(.*)$/,
  );
  if (range && !/\d/.test(range[4])) {
    const rawA = range[1].replace(/,/g, "");
    const rawB = range[3].replace(/,/g, "");
    return {
      kind: "range",
      endA: parseFloat(rawA),
      endB: parseFloat(rawB),
      sep: range[2],
      suffix: range[4],
      decimalsA: rawA.includes(".") ? rawA.split(".")[1].length : 0,
      decimalsB: rawB.includes(".") ? rawB.split(".")[1].length : 0,
    };
  }

  const single = value.match(/^(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (single && !/\d/.test(single[2])) {
    const raw = single[1].replace(/,/g, "");
    return {
      kind: "single",
      end: parseFloat(raw),
      suffix: single[2],
      decimals: raw.includes(".") ? raw.split(".")[1].length : 0,
    };
  }

  return { kind: "static" };
}

/**
 * Counts a numeric value up from 0 the first time it scrolls into view, then
 * holds. Supports plain numbers ("25+"), and ranges ("60–80", "620–750").
 * Non-numeric values render as-is. Reduced-motion shows the final value immediately.
 */
export function CountUp({ value }: { value: string }) {
  const parsed = parseValue(value);
  const animatable = parsed.kind !== "static";

  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!animatable) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let inView = false;

    const runCount = () => {
      cancelAnimationFrame(rafRef.current);
      setProgress(0);
      const duration = 1400;
      const startAt = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - startAt) / duration);
        setProgress(easeOutCubic(t));
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!inView) {
            inView = true;
            runCount();
          }
        } else {
          inView = false;
          cancelAnimationFrame(rafRef.current);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [animatable, value]);

  if (parsed.kind === "static") return <>{value}</>;

  const live =
    parsed.kind === "single"
      ? `${formatNumber(parsed.end * progress, parsed.decimals)}${parsed.suffix}`
      : `${formatNumber(parsed.endA * progress, parsed.decimalsA)}${parsed.sep}${formatNumber(
          parsed.endB * progress,
          parsed.decimalsB,
        )}${parsed.suffix}`;

  return (
    <span ref={ref} className="count-up" aria-label={value}>
      <span className="count-up__sizer" aria-hidden>
        {value}
      </span>
      <span className="count-up__live" aria-hidden>
        {live}
      </span>
    </span>
  );
}
