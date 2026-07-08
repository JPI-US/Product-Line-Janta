import {
  getWebsiteBelowScrollProgress,
  getWebsitePageScrollProgress,
  WEBSITE_PAGE_LIFT_START,
} from "./websiteScrollConfig";
import { websiteTowerOrbit } from "./websiteTowerOrbit";

/** Pause once below-hero content is in view */
const BELOW_PAUSE = 0.12;

/** Resume before the hero is fully back — pre-warms GPU + sky on the way up */
const BELOW_RESUME = 0.06;

/** Pause WebGL once the hero has cleared the viewport */
const PAGE_LIFT_PAUSE = 0.52;

let active = true;
let belowPaused = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function setActive(next: boolean) {
  if (next === active) return;
  active = next;
  notify();
  if (next) {
    window.dispatchEvent(new Event("hub-tower-invalidate"));
  }
}

function computeScrollHeroActive(offset: number): boolean {
  const below = getWebsiteBelowScrollProgress(offset);

  if (!belowPaused && below >= BELOW_PAUSE) {
    belowPaused = true;
  } else if (belowPaused && below <= BELOW_RESUME) {
    belowPaused = false;
  }

  return !belowPaused;
}

function computeActive(offset: number): boolean {
  if (websiteTowerOrbit.dragging) return true;
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    return false;
  }

  const pageScroll = getWebsitePageScrollProgress(offset);
  const below = getWebsiteBelowScrollProgress(offset);

  // Intro, hold, and early page-lift — hero stack still visible
  if (offset < WEBSITE_PAGE_LIFT_START + 0.015) {
    return true;
  }

  // Keep tower live through the hero slide — below-scroll must not cut it early
  if (pageScroll < PAGE_LIFT_PAUSE) {
    return true;
  }

  // Hero has cleared — pause GPU/sky until user scrolls back up
  if (below < 0.02) {
    return false;
  }

  return computeScrollHeroActive(offset);
}

export function getWebsiteHeroCanvasActive() {
  return active;
}

export function subscribeWebsiteHeroCanvasActive(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Called from the unified scroll bus (WebsitePageScrollCssSync). */
export function syncWebsiteHeroCanvasGate(offset: number) {
  setActive(computeActive(offset));
}

/** One-time mount — drag invalidates still re-evaluate gate state */
export function mountWebsiteHeroCanvasGate(_el: HTMLElement) {
  const onDrag = () => {
    if (websiteTowerOrbit.dragging) setActive(true);
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      setActive(false);
    }
  };

  window.addEventListener("hub-tower-invalidate", onDrag);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    window.removeEventListener("hub-tower-invalidate", onDrag);
    document.removeEventListener("visibilitychange", onVisibility);
    belowPaused = false;
    setActive(true);
  };
}
