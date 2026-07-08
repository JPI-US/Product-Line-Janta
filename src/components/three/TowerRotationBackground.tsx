import { useEffect } from "react";
import { isIntroAnimationComplete } from "./infoReveal";
import {
  ensureSharedIdleStarted,
  resetSharedIdle,
} from "./towerSharedRotation";
import {
  subscribeTowerScrollOffset,
  towerScrollOffset,
} from "./towerScrollOffset";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Shared yaw / idle timeline while WebGL is unmounted */
export function TowerRotationBackground() {
  useEffect(() => {
    const sync = () => {
      const offset = towerScrollOffset;
      if (!isIntroAnimationComplete(offset)) {
        resetSharedIdle();
      } else {
        ensureSharedIdleStarted(reducedMotion());
      }
    };

    sync();
    const unsubScrollOffset = subscribeTowerScrollOffset(sync);

    const page = document.querySelector(".tower-3d-page");
    page?.addEventListener("scroll", sync, { passive: true });

    const root = document.querySelector(".tower-3d__scroll-root");
    root?.addEventListener("scroll", sync, { passive: true });

    return () => {
      unsubScrollOffset();
      page?.removeEventListener("scroll", sync);
      root?.removeEventListener("scroll", sync);
    };
  }, []);

  return null;
}
