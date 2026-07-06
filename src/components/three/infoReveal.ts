import * as THREE from "three";
import {
  getBelowScrollVisualProgress as getGalleryBelowVisual,
  getGalleryScrollProgress,
} from "./galleryScroll";
import { ANIMATION_SCROLL_END, SCENE } from "./sceneConfig";

/** Share of post-intro scroll used to slide the fixed product view off-screen */
const PAGE_SLIDE_SHARE = 0.42;

/** Clamp scroll offset so intro animation stops once split is complete */
export function getIntroScrollOffset(scrollOffset: number): number {
  return Math.min(scrollOffset, SCENE.scroll.introEnd);
}

/** True once the scroll-driven camera / tower intro has finished */
export function isIntroAnimationComplete(scrollOffset: number): boolean {
  return getIntroScrollOffset(scrollOffset) >= ANIMATION_SCROLL_END - 1e-5;
}

/** 0→1 while the right product column opens (during intro only) */
export function getInfoRevealProgress(scrollOffset: number): number {
  const offset = getIntroScrollOffset(scrollOffset);
  const start = ANIMATION_SCROLL_END;
  const end = SCENE.scroll.introEnd;
  const span = end - start;
  if (span <= 0) return 0;
  const t = Math.min(1, Math.max(0, (offset - start) / span));
  return THREE.MathUtils.smoothstep(t, 0, 1);
}

function getPostIntroPhase(scrollOffset: number): number {
  const start = SCENE.scroll.introEnd;
  const span = 1 - start;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (scrollOffset - start) / span));
}

/** 0→1 — slides the fixed tower + product column off-screen */
export function getPageScrollProgress(scrollOffset: number): number {
  const phase = getPostIntroPhase(scrollOffset);
  return Math.min(1, phase / PAGE_SLIDE_SHARE);
}

/** 0→1 — scrolls the section below once the product view has cleared */
export function getBelowScrollProgress(scrollOffset: number): number {
  const phase = getPostIntroPhase(scrollOffset);
  if (phase <= PAGE_SLIDE_SHARE) return 0;
  return (phase - PAGE_SLIDE_SHARE) / (1 - PAGE_SLIDE_SHARE);
}

/** Below-scroll for layout — holds during horizontal gallery scrub */
export function getBelowScrollVisualProgress(scrollOffset: number): number {
  return getGalleryBelowVisual(scrollOffset);
}

export { getGalleryScrollProgress };

/** 0→1 — hero title fades out early during the tower/camera animation */
export function getHeroFadeProgress(scrollOffset: number): number {
  const fadeStart = 0.01;
  const fadeEnd = ANIMATION_SCROLL_END * 0.42;
  if (scrollOffset <= fadeStart) return 0;
  if (scrollOffset >= fadeEnd) return 1;
  const t = (scrollOffset - fadeStart) / (fadeEnd - fadeStart);
  return THREE.MathUtils.smoothstep(t, 0, 1);
}

/** Drag-to-rotate while split is open and the product view is still on screen */
export function canRotateTower(scrollOffset: number): boolean {
  return (
    getIntroScrollOffset(scrollOffset) >= ANIMATION_SCROLL_END &&
    getInfoRevealProgress(scrollOffset) >= 0.98 &&
    getPageScrollProgress(scrollOffset) < 0.92
  );
}
