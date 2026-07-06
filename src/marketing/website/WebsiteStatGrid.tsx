import { useEffect, useRef, useState } from "react";
import { WebsiteAnimatedStat } from "./WebsiteAnimatedStat";

type StatItem = {
  id: string;
  end: number;
  suffix: string;
  prefix?: string;
  label: string;
};

type WebsiteStatGridProps = {
  items: readonly StatItem[];
  className?: string;
};

/** Minimum time out of view before replay — avoids flicker while scrolling past. */
const REPLAY_OUT_MS = 320;

/**
 * One observer for the whole grid — replays all stats together when the band
 * leaves view and comes back (up or down).
 */
export function WebsiteStatGrid({ items, className }: WebsiteStatGridProps) {
  const gridRef = useRef<HTMLUListElement>(null);
  const [replayKey, setReplayKey] = useState(0);
  const inViewRef = useRef(false);
  const leftAtRef = useRef(0);
  const armedRef = useRef(false);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const wasOut = armedRef.current && !inViewRef.current;
          const outLongEnough =
            wasOut && Date.now() - leftAtRef.current >= REPLAY_OUT_MS;

          inViewRef.current = true;

          if (!armedRef.current || outLongEnough) {
            armedRef.current = true;
            setReplayKey((key) => key + 1);
          }
          return;
        }

        if (inViewRef.current) {
          leftAtRef.current = Date.now();
        }
        inViewRef.current = false;
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <ul ref={gridRef} className={className}>
      {items.map((item) => (
        <li
          key={item.id}
          className="web-stat__item"
          aria-label={`${item.prefix ?? ""}${item.end}${item.suffix} ${item.label}`}
        >
          <WebsiteAnimatedStat
            end={item.end}
            prefix={item.prefix}
            suffix={item.suffix}
            replayKey={replayKey}
          />
          <span className="web-stat__label">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
