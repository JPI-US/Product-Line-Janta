import { SCENE } from "./sceneConfig";
import {
  getDesignerFrozenBelow,
  getDesignerGalleryProgress,
  resetDesignerGalleryScrub,
  syncDesignerGalleryScrub,
} from "./designerGalleryScrub";

const PAGE_SLIDE_SHARE = 0.42;

export function scrollOffsetToBelowFraction(scrollOffset: number): number {
  const introEnd = SCENE.scroll.introEnd;
  const postSpan = 1 - introEnd;
  if (postSpan <= 0) return 0;
  const phase = Math.min(1, Math.max(0, (scrollOffset - introEnd) / postSpan));
  if (phase <= PAGE_SLIDE_SHARE) return 0;
  return (phase - PAGE_SLIDE_SHARE) / (1 - PAGE_SLIDE_SHARE);
}

/** 0→1 — horizontal card scrub (designer wheel state) */
export function getGalleryScrollProgress(_scrollOffset: number): number {
  return getDesignerGalleryProgress();
}

/** Below-scroll — frozen while gallery scrubs horizontally */
export function getBelowScrollVisualProgress(scrollOffset: number): number {
  const frozen = getDesignerFrozenBelow();
  if (frozen !== undefined) return frozen;

  if (typeof document !== "undefined") {
    const page = document.querySelector<HTMLElement>(".tower-3d-page");
    if (page) syncDesignerGalleryScrub(scrollOffset, page);
  }

  return scrollOffsetToBelowFraction(scrollOffset);
}

export function markGalleryReady(page: HTMLElement): void {
  page.dataset.galleryReady = "1";
}

export function clearGalleryPinBand(page: HTMLElement): void {
  resetDesignerGalleryScrub();
  delete page.dataset.galleryReady;
  page.removeAttribute("data-gallery-scrubbing");
}

export function measureGalleryTrackEnd(gallery: HTMLElement): number {
  const track = gallery.querySelector<HTMLElement>(".tower-3d__h-gallery__track");
  if (!track) return 0;

  const cards = track.querySelectorAll<HTMLElement>(".tower-3d__h-gallery__card");
  if (cards.length === 0) return 0;

  const gap =
    parseFloat(getComputedStyle(track).columnGap) ||
    parseFloat(getComputedStyle(track).gap) ||
    12;
  const cardW = cards[0].offsetWidth;
  const stepPx =
    cards.length > 1 && cards[1].offsetLeft > cards[0].offsetLeft
      ? cards[1].offsetLeft - cards[0].offsetLeft
      : cardW + gap;
  const padL =
    cards[0].offsetLeft ||
    parseFloat(getComputedStyle(track).paddingLeft) ||
    0;
  const rightGutter = Math.min(24, Math.max(14, window.innerWidth * 0.018));
  const slideSteps = Math.max(1, cards.length - 1);
  let endPx = -slideSteps * stepPx;
  const endPad = Math.max(0, window.innerWidth - padL - cardW - rightGutter);
  endPx = endPx + endPad;
  if (Math.abs(endPx) < stepPx * 0.35) {
    endPx = -slideSteps * stepPx;
  }
  return endPx;
}
