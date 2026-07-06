import { getPageScrollProgress } from "./infoReveal";
import { isAnyTowerDragging } from "./towerDragSync";
import { towerSharedRotation } from "./towerSharedRotation";
import { towerScrollOffset } from "./towerScrollOffset";

/** Hero 3D column is still on screen (not fully slid away) */
const HERO_VISIBLE_PAGE_SCROLL = 0.985;

/** Skip WebGL work while scrolling the below-the-fold section (gallery, specs, etc.) */
export function isProductHero3dActive(
  scrollOffset = towerScrollOffset
): boolean {
  const pageScroll = getPageScrollProgress(scrollOffset);
  if (pageScroll < HERO_VISIBLE_PAGE_SCROLL) return true;
  if (isAnyTowerDragging()) return true;
  if (
    towerSharedRotation.idleEpochMs !== null &&
    pageScroll < 0.999
  ) {
    return true;
  }
  return false;
}
