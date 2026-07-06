import { getImmediateScrollOffset } from "../../components/three/scrollOffset";
import {
  getWebsiteBelowScrollProgress,
  getWebsiteOffsetFromBelowScrollProgress,
} from "./websiteScrollConfig";
import { applyWebsiteScrollStats } from "./websiteScrollCss";
import { getWebsiteScrollVarState } from "./websiteScrollCssState";
import {
  setWebsiteDrivenScrollOffset,
} from "./websiteScrollDriver";
import { getWebsiteScrollRoot } from "./websiteScrollRoot";

const RANGE_EPS_PX = 4;
const SCROLL_IDLE_MS = 120;
const LAYOUT_DEBOUNCE_MS = 80;

let scrollIdleTimer = 0;
let layoutDebounceTimer = 0;
let scrollInProgress = false;
let layoutFreezeCount = 0;
let pendingLayoutPage: HTMLElement | null = null;
let cachedBelowScrollRangePx = 0;

/** Suppress below-scroll remeasure while stat counters reset. */
export function freezeWebsiteBelowScrollLayout() {
  layoutFreezeCount += 1;
}

export function unfreezeWebsiteBelowScrollLayout() {
  layoutFreezeCount = Math.max(0, layoutFreezeCount - 1);
}

function readBelowScrollPx(page: HTMLElement): number {
  const inline = page.style.getPropertyValue("--web-below-scroll-px").trim();
  if (inline.endsWith("px")) {
    const px = parseFloat(inline);
    if (Number.isFinite(px) && px >= 0) return px;
  }

  const root = getWebsiteScrollRoot();
  if (!root) return 0;

  const offset = getImmediateScrollOffset(root);
  return getWebsiteBelowScrollProgress(offset) * readBelowScrollRangePx(page);
}

/** Read the active below-scroll travel in pixels (inline var → cache). */
export function readBelowScrollRangePx(page: HTMLElement): number {
  const inline = page.style.getPropertyValue("--web-below-scroll-range").trim();
  if (inline.endsWith("px")) {
    const px = parseFloat(inline);
    if (Number.isFinite(px) && px > 0) {
      cachedBelowScrollRangePx = px;
      return px;
    }
  }

  if (cachedBelowScrollRangePx > 0) {
    return cachedBelowScrollRangePx;
  }

  const raw = getComputedStyle(page).getPropertyValue("--web-below-scroll-range").trim();
  if (!raw) return window.innerHeight;

  if (raw.endsWith("vh")) {
    cachedBelowScrollRangePx = (window.innerHeight * parseFloat(raw)) / 100;
    return cachedBelowScrollRangePx;
  }
  if (raw.endsWith("px")) {
    cachedBelowScrollRangePx = parseFloat(raw);
    return cachedBelowScrollRangePx;
  }

  const n = parseFloat(raw);
  cachedBelowScrollRangePx = Number.isFinite(n) ? n : window.innerHeight;
  return cachedBelowScrollRangePx;
}

/** Pixel travel for post-hero content — measured from DOM, not a magic vh guess */
export function measureWebsiteBelowScrollRange(page: HTMLElement): number {
  const below = page.querySelector<HTMLElement>(".web__below-scroll");
  const viewport = page.querySelector<HTMLElement>(".web__page-below");
  if (!below || !viewport) return 0;

  const travel = below.scrollHeight - viewport.clientHeight;
  return Math.max(1, travel);
}

/** Call on each scroll tick — defers layout remeasure until scrolling stops. */
export function markWebsiteBelowScrollInProgress(page: HTMLElement) {
  pendingLayoutPage = page;
  scrollInProgress = true;
  window.clearTimeout(scrollIdleTimer);
  scrollIdleTimer = window.setTimeout(() => {
    scrollInProgress = false;
    const target = pendingLayoutPage;
    pendingLayoutPage = null;
    if (target) applyWebsiteBelowScrollRange(target);
  }, SCROLL_IDLE_MS);
}

/** Debounced remeasure — skipped while the user is actively scrolling. */
export function scheduleWebsiteBelowScrollRangeSync(page: HTMLElement) {
  pendingLayoutPage = page;
  window.clearTimeout(layoutDebounceTimer);
  layoutDebounceTimer = window.setTimeout(() => {
    if (!scrollInProgress) applyWebsiteBelowScrollRange(page);
  }, LAYOUT_DEBOUNCE_MS);
}

/**
 * Updates below-scroll travel and compensates scroll when lazy content changes height.
 * Only runs while scroll is idle so scrollTop corrections do not fight wheel input.
 */
export function applyWebsiteBelowScrollRange(page: HTMLElement) {
  if (scrollInProgress || layoutFreezeCount > 0) return;

  const prevPx = readBelowScrollRangePx(page);
  const nextPx = measureWebsiteBelowScrollRange(page);

  if (Math.abs(nextPx - prevPx) < RANGE_EPS_PX) {
    if (!page.style.getPropertyValue("--web-below-scroll-range").endsWith("px")) {
      page.style.setProperty("--web-below-scroll-range", `${nextPx}px`);
      cachedBelowScrollRangePx = nextPx;
    }
    return;
  }

  const preservedPx = readBelowScrollPx(page);

  page.style.setProperty("--web-below-scroll-range", `${nextPx}px`);
  cachedBelowScrollRangePx = nextPx;

  if (preservedPx <= 0.5 || prevPx <= 0) return;

  page.style.setProperty("--web-below-scroll-px", `${preservedPx}px`);
  const adjustedBelow = Math.min(1, preservedPx / nextPx);
  const adjustedOffset = getWebsiteOffsetFromBelowScrollProgress(adjustedBelow);
  setWebsiteDrivenScrollOffset(adjustedOffset);
  applyWebsiteScrollStats(adjustedOffset, page, getWebsiteScrollVarState());
}
