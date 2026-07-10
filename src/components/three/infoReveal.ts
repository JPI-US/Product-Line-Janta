import * as THREE from "three";
import {
  getBelowScrollVisualProgress as getGalleryBelowVisual,
  getGalleryScrollProgress,
} from "./galleryScroll";
import { ANIMATION_SCROLL_END, SCENE } from "./sceneConfig";
import { isProductHeroPageFromDom } from "../../lib/productHeroScroll";

/** Share of post-intro scroll used to slide the fixed product view off-screen */
const PAGE_SLIDE_SHARE = 0.42;

const CLICK_OFFSET_EPS = 0.018;

function resolveProductHero(productHero?: boolean): boolean {
  if (productHero !== undefined) return productHero;
  return isProductHeroPageFromDom();
}

function getPostIntroStart(productHero = resolveProductHero()): number {
  return productHero ? ANIMATION_SCROLL_END : SCENE.scroll.introEnd;
}

/** Clamp scroll offset so intro animation stops once the hero handoff completes */
export function getIntroScrollOffset(
  scrollOffset: number,
  productHero = resolveProductHero()
): number {
  return Math.min(scrollOffset, getPostIntroStart(productHero));
}

/** True once the scroll-driven camera / tower intro has finished */
export function isIntroAnimationComplete(
  scrollOffset: number,
  productHero = resolveProductHero()
): boolean {
  return (
    getIntroScrollOffset(scrollOffset, productHero) >= ANIMATION_SCROLL_END - 1e-5
  );
}

/** 0→1 while the right product column opens (legacy utility split only) */
export function getInfoRevealProgress(
  scrollOffset: number,
  productHero = resolveProductHero()
): number {
  const offset = getIntroScrollOffset(scrollOffset, productHero);
  if (productHero && offset >= ANIMATION_SCROLL_END - 1e-5) return 1;

  const start = ANIMATION_SCROLL_END;
  const end = SCENE.scroll.introEnd;
  const span = end - start;
  if (span <= 0) return 0;
  const t = Math.min(1, Math.max(0, (offset - start) / span));
  return THREE.MathUtils.smoothstep(t, 0, 1);
}

function getPostIntroPhase(
  scrollOffset: number,
  productHero = resolveProductHero()
): number {
  const start = getPostIntroStart(productHero);
  const span = 1 - start;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (scrollOffset - start) / span));
}

/** 0→1 — slides the fixed tower + product column off-screen */
export function getPageScrollProgress(
  scrollOffset: number,
  productHero = resolveProductHero()
): number {
  const phase = getPostIntroPhase(scrollOffset, productHero);
  return Math.min(1, phase / PAGE_SLIDE_SHARE);
}

/** 0→1 — scrolls the section below once the product view has cleared */
export function getBelowScrollProgress(
  scrollOffset: number,
  productHero = resolveProductHero()
): number {
  const phase = getPostIntroPhase(scrollOffset, productHero);
  if (phase <= PAGE_SLIDE_SHARE) return 0;
  return (phase - PAGE_SLIDE_SHARE) / (1 - PAGE_SLIDE_SHARE);
}

/** Below-scroll for layout — holds during horizontal gallery scrub */
export function getBelowScrollVisualProgress(
  scrollOffset: number,
  productHero = resolveProductHero()
): number {
  return getGalleryBelowVisual(scrollOffset, productHero);
}

export { getGalleryScrollProgress };

/** 0→1 — hero title fades out early during the tower/camera animation */
export function getHeroFadeProgress(scrollOffset: number): number {
  const fadeStart = 0.01;
  const fadeEnd = ANIMATION_SCROLL_END * 0.2;
  if (scrollOffset <= fadeStart) return 0;
  if (scrollOffset >= fadeEnd) return 1;
  const t = (scrollOffset - fadeStart) / (fadeEnd - fadeStart);
  return THREE.MathUtils.smoothstep(t, 0, 1);
}

/** DSR — title/eyebrow persist through intro + idle; fade as the hero lifts away */
export function getDesignerHeroFadeProgress(scrollOffset: number): number {
  const pageScroll = getPageScrollProgress(scrollOffset, true);
  return THREE.MathUtils.smoothstep(pageScroll, 0, 1);
}

/** Drag-to-rotate while the hero tower is on screen */
export function canRotateTower(
  scrollOffset: number,
  productHero = resolveProductHero()
): boolean {
  if (productHero) {
    return (
      isIntroAnimationComplete(scrollOffset, true) &&
      getPageScrollProgress(scrollOffset, true) < 0.92
    );
  }
  return (
    getIntroScrollOffset(scrollOffset, false) >= ANIMATION_SCROLL_END &&
    getInfoRevealProgress(scrollOffset, false) >= 0.98 &&
    getPageScrollProgress(scrollOffset, false) < 0.92
  );
}

/** True once the tower pendulum idle animation has started */
export function isTowerIdleReady(
  scrollOffset: number,
  productHero: boolean
): boolean {
  if (productHero) {
    return isIntroAnimationComplete(scrollOffset, true);
  }
  return getInfoRevealProgress(scrollOffset, false) >= 0.98;
}

/** Normalized offset where the DSR tower hands off to idle */
export function getDesignerIdleScrollOffset(): number {
  return ANIMATION_SCROLL_END;
}

/** Next tap-to-scroll target for DSR — idle handoff only */
export function getDesignerClickScrollTarget(current: number): number | null {
  const idle = getDesignerIdleScrollOffset();
  if (current < idle - CLICK_OFFSET_EPS) return idle;
  return null;
}

/** DSR — hint ramps in before idle lands; stays up longer into page flow */
const DESIGNER_HINT_INTRO_START = 0.68;
const DESIGNER_HINT_INTRO_FULL = 0.9;
const DESIGNER_HINT_PAGE_HOLD = 0.2;
const DESIGNER_HINT_PAGE_FADE_END = 0.62;

/** 0→1 — scroll-down hint visible while idle and before page flow begins */
export function getIdleHintVisibility(
  scrollOffset: number,
  productHero: boolean
): number {
  if (productHero) {
    const introT =
      getIntroScrollOffset(scrollOffset, true) / ANIMATION_SCROLL_END;
    if (introT < DESIGNER_HINT_INTRO_START) return 0;

    const pageScroll = getPageScrollProgress(scrollOffset, true);
    if (pageScroll >= DESIGNER_HINT_PAGE_FADE_END) return 0;

    const fadeIn = THREE.MathUtils.smoothstep(
      introT,
      DESIGNER_HINT_INTRO_START,
      DESIGNER_HINT_INTRO_FULL
    );
    let fadeOut = 1;
    if (pageScroll > DESIGNER_HINT_PAGE_HOLD) {
      fadeOut =
        1 -
        (pageScroll - DESIGNER_HINT_PAGE_HOLD) /
          (DESIGNER_HINT_PAGE_FADE_END - DESIGNER_HINT_PAGE_HOLD);
    }
    return fadeIn * Math.max(0, fadeOut);
  }

  if (!isTowerIdleReady(scrollOffset, productHero)) return 0;
  const pageScroll = getPageScrollProgress(scrollOffset, productHero);
  if (pageScroll >= 0.15) return 0;
  return 1 - pageScroll / 0.15;
}
