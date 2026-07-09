import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * Counts a numeric value up from 0 the first time it scrolls into view, then
 * holds. Non-numeric values ("Plug & play") and mixed ones ("8 × 720 W") render
 * as-is. Reduced-motion shows the final value immediately. Renders inline so it
 * inherits the surrounding value styling; a hidden sizer reserves final width.
 */
export function CountUp({ value }: { value: string }) {
  const match = value.match(/^(\d[\d,]*(?:\.\d+)?)(.*)$/);
  const suffix = match ? match[2] : "";
  const animatable = !!match && !/\d/.test(suffix);
  const raw = animatable ? match![1].replace(/,/g, "") : "0";
  const end = animatable ? parseFloat(raw) : 0;
  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;

  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!animatable) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(end);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let started = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        observer.disconnect();
        const duration = 1400;
        const startAt = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - startAt) / duration);
          setDisplay(end * easeOutCubic(progress));
          if (progress < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [animatable, end]);

  if (!animatable) return <>{value}</>;

  const format = (n: number) => {
    const [int, dec] = n.toFixed(decimals).split(".");
    const grouped = Number(int).toLocaleString("en-US");
    return dec ? `${grouped}.${dec}` : grouped;
  };

  return (
    <span ref={ref} className="count-up" aria-label={value}>
      <span className="count-up__sizer" aria-hidden>
        {value}
      </span>
      <span className="count-up__live" aria-hidden>
        {format(display)}
        {suffix}
      </span>
    </span>
  );
}
