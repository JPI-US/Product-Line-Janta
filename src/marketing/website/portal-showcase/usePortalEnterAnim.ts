import { useEffect, useRef, useState } from "react";

/** Wait until the tablet is in view before chart/gauge enter animations. */
const ENTER_DELAY_MS = 200;

export const PORTAL_ENTER_EASE = "cubic-bezier(0.25, 1, 0.5, 1)";
export const PORTAL_ENTER_MS = 620;
/** Top status cards (gauge, tower ring, kW count-up) — slightly slower than charts */
export const PORTAL_STATUS_ENTER_MS = 1080;
export const PORTAL_BAR_STAGGER_MS = 28;
export const PORTAL_HEALTH_STAGGER_MS = 92;

/** Longest enter sequence — charts + health dots stagger */
export const PORTAL_EXIT_MS = Math.max(
  PORTAL_STATUS_ENTER_MS,
  PORTAL_ENTER_MS + 23 * PORTAL_BAR_STAGGER_MS,
  620 + 7 * PORTAL_HEALTH_STAGGER_MS,
);

export type PortalMotion = {
  /** Expanded visuals (charts drawn, gauge filled, dots visible) */
  expanded: boolean;
  /** CSS/JS transitions active during enter and exit */
  motion: boolean;
  exiting: boolean;
};

/** Enter after delay; exit collapses in reverse before returning to idle. */
export function usePortalEnterAnim(animate: boolean): PortalMotion {
  const [expanded, setExpanded] = useState(false);
  const [motion, setMotion] = useState(false);
  const timerRef = useRef(0);
  const phaseRef = useRef<"idle" | "expanded" | "exiting">("idle");

  useEffect(() => {
    window.clearTimeout(timerRef.current);

    if (animate) {
      phaseRef.current = "expanded";
      timerRef.current = window.setTimeout(() => {
        setMotion(true);
        setExpanded(true);
      }, ENTER_DELAY_MS);

      return () => window.clearTimeout(timerRef.current);
    }

    if (phaseRef.current === "idle" && !expanded && !motion) return;

    phaseRef.current = "exiting";
    setMotion(true);
    setExpanded(false);

    timerRef.current = window.setTimeout(() => {
      setMotion(false);
      phaseRef.current = "idle";
    }, PORTAL_EXIT_MS);

    return () => window.clearTimeout(timerRef.current);
  }, [animate]);

  return {
    expanded,
    motion,
    exiting: motion && !expanded,
  };
}
