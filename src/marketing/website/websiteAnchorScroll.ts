import { readBelowScrollRangePx } from "./websiteBelowScrollMeasure";
import { getWebsiteOffsetFromBelowScrollProgress } from "./websiteScrollConfig";
import { easeWebsiteScrollTo } from "./websiteScrollDriver";

/** Small breathing room below the nav so the target isn't flush to the top */
const ANCHOR_TOP_MARGIN_PX = 24;

/**
 * Scroll the virtual page so an in-page anchor target comes into view, matching
 * a natural scroll. Below-fold content lives in a transformed `.web__below-scroll`
 * track, so we map the target's position within that track to a scroll offset and
 * ease the hidden scroll root to it.
 *
 * Returns true when it handled the target (caller should preventDefault).
 */
export function scrollWebsiteToAnchor(hash: string): boolean {
  if (!hash || hash === "#") return false;

  const page = document.querySelector<HTMLElement>(".web-page");
  const below = page?.querySelector<HTMLElement>(".web__below-scroll");
  if (!page || !below) return false;

  let target: HTMLElement | null = null;
  try {
    target = below.querySelector<HTMLElement>(hash);
  } catch {
    return false;
  }
  if (!target) return false;

  const rangePx = readBelowScrollRangePx(page);
  if (rangePx <= 0) return false;

  const targetTopWithinBelow =
    target.getBoundingClientRect().top - below.getBoundingClientRect().top;

  const belowScrollPx = Math.max(0, targetTopWithinBelow - ANCHOR_TOP_MARGIN_PX);
  const belowProgress = Math.min(1, belowScrollPx / rangePx);
  const offset = getWebsiteOffsetFromBelowScrollProgress(belowProgress);

  easeWebsiteScrollTo(offset);
  return true;
}
