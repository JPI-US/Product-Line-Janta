import {
  canRotateTower,
  getBelowScrollVisualProgress,
  getGalleryScrollProgress,
  getHeroFadeProgress,
  getInfoRevealProgress,
  getPageScrollProgress,
} from "./infoReveal";
import { towerDragState } from "./towerDragState";
import { setTowerScrollOffset } from "./towerScrollOffset";

const VAR_EPSILON = 0.0012;

export type ScrollVarState = {
  towerScroll: number;
  infoReveal: number;
  pageScroll: number;
  belowScroll: number;
  galleryProgress: number;
  heroFade: number;
  rotateReady: boolean;
};

export function createScrollVarState(): ScrollVarState {
  return {
    towerScroll: -1,
    infoReveal: -1,
    pageScroll: -1,
    belowScroll: -1,
    galleryProgress: -1,
    heroFade: -1,
    rotateReady: false,
  };
}

/** Drive layout CSS vars + shared scroll offset from a normalized 0–1 position */
export function applyScrollStats(
  offset: number,
  page: HTMLElement,
  prev: ScrollVarState
) {
  setTowerScrollOffset(offset);
  const infoReveal = getInfoRevealProgress(offset);
  const pageScroll = getPageScrollProgress(offset);
  const belowScroll = getBelowScrollVisualProgress(offset);
  const galleryProgress = getGalleryScrollProgress(offset);
  const heroFade = getHeroFadeProgress(offset);

  if (Math.abs(offset - prev.towerScroll) > VAR_EPSILON) {
    page.style.setProperty("--tower-scroll", String(offset));
    prev.towerScroll = offset;
  }
  if (Math.abs(infoReveal - prev.infoReveal) > VAR_EPSILON) {
    page.style.setProperty("--info-reveal", String(infoReveal));
    prev.infoReveal = infoReveal;
  }
  if (Math.abs(pageScroll - prev.pageScroll) > VAR_EPSILON) {
    page.style.setProperty("--page-scroll", String(pageScroll));
    prev.pageScroll = pageScroll;
  }
  if (Math.abs(belowScroll - prev.belowScroll) > VAR_EPSILON) {
    page.style.setProperty("--below-scroll", String(belowScroll));
    prev.belowScroll = belowScroll;
  }
  if (Math.abs(galleryProgress - prev.galleryProgress) > VAR_EPSILON) {
    page.style.setProperty("--gallery-progress", String(galleryProgress));
    prev.galleryProgress = galleryProgress;
  }

  if (Math.abs(heroFade - prev.heroFade) > VAR_EPSILON) {
    page.style.setProperty("--hero-fade", String(heroFade));
    prev.heroFade = heroFade;
  }

  const rotateReady = canRotateTower(offset);
  towerDragState.canRotate = rotateReady;
  if (rotateReady !== prev.rotateReady) {
    document.documentElement.classList.toggle(
      "tower-3d-rotate-ready",
      rotateReady
    );
    prev.rotateReady = rotateReady;
  }
}
