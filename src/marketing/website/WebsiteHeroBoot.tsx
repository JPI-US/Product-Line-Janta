import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";

/** Overlay never lingers past this even if a load stalls (ms). */
const BOOT_MAX_MS = 9000;
/** If no loader activity starts within this window, assets were cached. */
const BOOT_IDLE_MS = 1800;
/** Keep the overlay mounted through its fade-out transition. */
const FADE_MS = 650;

/**
 * Hero boot overlay — replaces the blank night gradient while the tower GLB
 * and sky assets stream in. Tracks drei's global loading progress (shared
 * DefaultLoadingManager), shows a thin white progress bar, then crossfades
 * away as the WebGL canvas fades in (via `web-hero-product-line--booting`
 * on the hero root).
 */
export function WebsiteHeroBoot({
  onDone,
}: {
  onDone: () => void;
}) {
  const { active, progress } = useProgress();
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const sawActivity = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  if (active) sawActivity.current = true;

  const finished = sawActivity.current && !active && progress >= 100;

  useEffect(() => {
    if (leaving) return;
    if (finished) {
      setLeaving(true);
      return;
    }
    // Cached assets never flip `active` — bail after a short idle window
    const idle = window.setTimeout(() => {
      if (!sawActivity.current) setLeaving(true);
    }, BOOT_IDLE_MS);
    const hardStop = window.setTimeout(() => setLeaving(true), BOOT_MAX_MS);
    return () => {
      window.clearTimeout(idle);
      window.clearTimeout(hardStop);
    };
  }, [finished, leaving]);

  useEffect(() => {
    if (!leaving) return;
    doneRef.current();
    const t = window.setTimeout(() => setGone(true), FADE_MS);
    return () => window.clearTimeout(t);
  }, [leaving]);

  if (gone) return null;

  const shown = Math.max(6, Math.round(progress));

  return (
    <div
      className={
        leaving ? "web-hero-boot web-hero-boot--leaving" : "web-hero-boot"
      }
      role="status"
      aria-live="polite"
      aria-label="Loading 3D experience"
    >
      <div className="web-hero-boot__bar-track" aria-hidden>
        <div
          className="web-hero-boot__bar"
          style={{ transform: `scaleX(${leaving ? 1 : shown / 100})` }}
        />
      </div>
    </div>
  );
}
