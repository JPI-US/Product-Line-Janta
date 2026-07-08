import {
  getBelowScrollProgress,
  getPageScrollProgress,
  isIntroAnimationComplete,
} from "./infoReveal";

/** Hysteresis — avoids flip-flopping while crossing tower sections */
const UTILITY_ON = 0.2;
const UTILITY_OFF = 0.13;
const DESIGNER_ON_BELOW = 0.07;
const DESIGNER_MAX_PAGE = 0.98;

/** Hidden utility canvas for shader compile — after intro, before utility draw */
export const UTILITY_GL_PIN_BELOW = 0.04;

export type TowerActiveView = "designer" | "utility" | "none";

export type ScrollVisibilityState = {
  activeView: TowerActiveView;
  renderDesigner3d: boolean;
  renderUtility3d: boolean;
  pinUtilityGl: boolean;
};

export function resolveTowerScrollVisibility(
  scrollOffset: number,
  prev: TowerActiveView,
  utilityGlPinned: boolean,
  utilityPrepDone: boolean
): ScrollVisibilityState {
  const below = getBelowScrollProgress(scrollOffset);
  const pageScroll = getPageScrollProgress(scrollOffset);
  const introDone = isIntroAnimationComplete(scrollOffset);

  let active = prev;

  if (below >= UTILITY_ON) {
    active = "utility";
  } else if (below > UTILITY_OFF) {
    active = prev === "utility" ? "utility" : "none";
  } else if (below <= DESIGNER_ON_BELOW && pageScroll < DESIGNER_MAX_PAGE) {
    active = "designer";
  } else {
    active = "none";
  }

  const pinUtilityGl =
    utilityGlPinned ||
    (utilityPrepDone &&
      introDone &&
      below >= UTILITY_GL_PIN_BELOW);

  return {
    activeView: active,
    renderDesigner3d: active === "designer",
    renderUtility3d: active === "utility",
    pinUtilityGl,
  };
}
