import {
  getBelowScrollProgress,
  getPageScrollProgress,
  isIntroAnimationComplete,
} from "./infoReveal";
import { towerScrollOffset } from "./towerScrollOffset";

/** Start utility mesh prep after intro — before utility GL pin (panels scroll) */
export function shouldStartUtilityPreload(
  scrollOffset = towerScrollOffset
): boolean {
  if (!isIntroAnimationComplete(scrollOffset)) return false;
  return (
    getPageScrollProgress(scrollOffset) >= 0.15 ||
    getBelowScrollProgress(scrollOffset) >= 0.06
  );
}
