import { designerGallerySlides } from "../../data/productGallery";
import { getImmediateScrollOffset } from "./scrollOffset";
import { scrollOffsetToBelowFraction } from "./galleryScroll";
import { applyScrollStats } from "./towerScrollCss";
import { getSharedScrollVarState } from "./towerScrollCssState";

type ScrubPhase = "idle" | "scrub" | "done";

let phase: ScrubPhase = "idle";
let progress = 0;
let frozenBelow = 0;
let completedAtBelow = 0;

const HEADER_PIN_TOLERANCE_PX = 32;

function getHeaderPinTop(page: HTMLElement): number {
  const navH =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--app-nav-h"
      )
    ) || 0;
  const pinTop =
    parseFloat(page.style.getPropertyValue("--gallery-pin-top")) || 16;
  return navH + pinTop;
}

function scrubRunwayPx(): number {
  const steps = Math.max(1, designerGallerySlides.length - 1);
  return window.innerHeight * 0.9 * steps;
}

export function resetDesignerGalleryScrub(): void {
  phase = "idle";
  progress = 0;
  frozenBelow = 0;
  completedAtBelow = 0;
}

export function getDesignerGalleryProgress(): number {
  return progress;
}

export function getDesignerFrozenBelow(): number | undefined {
  if (phase === "scrub") return frozenBelow;
  return undefined;
}

export function syncDesignerGalleryScrub(
  scrollOffset: number,
  page: HTMLElement
): void {
  if (!page.dataset.galleryReady || phase !== "done") return;

  const below = scrollOffsetToBelowFraction(scrollOffset);
  if (below < completedAtBelow - 0.05) {
    resetDesignerGalleryScrub();
    page.removeAttribute("data-gallery-scrubbing");
  }
}

function pushGalleryStyles(page: HTMLElement, scrollRoot: HTMLElement) {
  page.style.setProperty("--gallery-progress", String(progress));
  page.style.setProperty("--below-scroll", String(frozenBelow));
  const state = getSharedScrollVarState();
  state.galleryProgress = progress;
  state.belowScroll = frozenBelow;
  applyScrollStats(getImmediateScrollOffset(scrollRoot), page, state);
}

/** Jump to a gallery slide by index (0-based). Used by click / dot controls. */
export function setDesignerGallerySlide(
  targetIndex: number,
  scrollRoot: HTMLElement
): boolean {
  const page = document.querySelector<HTMLElement>(".tower-3d-page");
  if (!page?.dataset.galleryReady) return false;

  const slideCount = designerGallerySlides.length;
  if (slideCount < 2) return false;

  const index = Math.min(slideCount - 1, Math.max(0, Math.round(targetIndex)));
  const nextProgress = index / (slideCount - 1);
  const below = parseFloat(page.style.getPropertyValue("--below-scroll") || "0");

  if (phase === "idle") {
    frozenBelow = Number.isFinite(below) ? below : 0;
  } else if (phase === "done" && !frozenBelow) {
    frozenBelow = completedAtBelow || (Number.isFinite(below) ? below : 0);
  }

  progress = nextProgress;

  if (progress >= 1) {
    phase = "done";
    completedAtBelow = frozenBelow;
    page.removeAttribute("data-gallery-scrubbing");
  } else {
    phase = "scrub";
    page.setAttribute("data-gallery-scrubbing", "1");
  }

  pushGalleryStyles(page, scrollRoot);
  return true;
}

export function advanceDesignerGallerySlide(
  delta: number,
  scrollRoot: HTMLElement
): boolean {
  const slideCount = designerGallerySlides.length;
  const currentIndex = Math.round(getDesignerGalleryProgress() * (slideCount - 1));
  return setDesignerGallerySlide(currentIndex + delta, scrollRoot);
}

/**
 * When the gallery header is pinned, wheel scrubs cards horizontally.
 * Vertical scroll resumes after the last card or when scrolling up away from the gallery.
 */
export function handleDesignerGalleryWheel(
  event: WheelEvent,
  scrollRoot: HTMLElement
): boolean {
  const page = document.querySelector<HTMLElement>(".tower-3d-page");
  const header = page?.querySelector<HTMLElement>(
    ".tower-3d__h-gallery__header"
  );
  if (!page?.dataset.galleryReady || !header) return false;

  if (designerGallerySlides.length < 2) return false;

  const targetTop = getHeaderPinTop(page);
  const headerTop = header.getBoundingClientRect().top;
  const below = parseFloat(page.style.getPropertyValue("--below-scroll") || "0");
  const runway = scrubRunwayPx();

  const inPinZone =
    headerTop <= targetTop + HEADER_PIN_TOLERANCE_PX &&
    headerTop >= targetTop - 100;

  if (phase === "idle" && event.deltaY > 0 && inPinZone) {
    phase = "scrub";
    frozenBelow = below;
    progress = 0;
    completedAtBelow = 0;
    page.setAttribute("data-gallery-scrubbing", "1");
  }

  if (phase === "done" && event.deltaY > 0) {
    return false;
  }

  if (phase === "scrub" && event.deltaY < 0 && progress <= 0.002) {
    phase = "idle";
    progress = 0;
    page.removeAttribute("data-gallery-scrubbing");
    return false;
  }

  if (phase === "scrub") {
    event.preventDefault();
    progress = Math.min(1, Math.max(0, progress + event.deltaY / runway));

    if (progress >= 1) {
      phase = "done";
      completedAtBelow = frozenBelow;
      progress = 1;
      page.removeAttribute("data-gallery-scrubbing");
    }

    pushGalleryStyles(page, scrollRoot);
    return true;
  }

  if (phase === "done" && event.deltaY < 0) {
    if (!inPinZone) {
      return false;
    }

    event.preventDefault();
    phase = "scrub";
    page.setAttribute("data-gallery-scrubbing", "1");
    progress = Math.min(1, Math.max(0, progress + event.deltaY / runway));

    if (progress <= 0) {
      phase = "idle";
      page.removeAttribute("data-gallery-scrubbing");
    }

    pushGalleryStyles(page, scrollRoot);
    return true;
  }

  return false;
}
