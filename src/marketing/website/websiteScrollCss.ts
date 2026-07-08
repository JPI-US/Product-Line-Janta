import { getWebsiteSkyBlend } from "./websiteDayCycle";
import {
  getWebsiteAnimationBlend,
  getWebsiteBelowScrollProgress,
  getWebsiteNavSurface,
  getWebsitePageScrollProgress,
  WEBSITE_PAGE_LIFT_START,
} from "./websiteScrollConfig";
import { readBelowScrollRangePx } from "./websiteBelowScrollMeasure";
import { websiteTowerOrbit } from "./websiteTowerOrbit";
const VAR_EPSILON = 0.0018;
const NAV_SURFACE_STEP = 0.05;
const ORBIT_READY_EPS = 0.004;

export type WebScrollVarState = {
  scrollOffset: number;
  introBlend: number;
  skyBlend: number;
  pageScroll: number;
  belowScroll: number;
  belowScrollPx: number;
  navSurface: number;
  orbitReady: boolean;
};

export function createWebScrollVarState(): WebScrollVarState {
  return {
    scrollOffset: -1,
    introBlend: -1,
    skyBlend: -1,
    pageScroll: -1,
    belowScroll: -1,
    belowScrollPx: -1,
    navSurface: -1,
    orbitReady: false,
  };
}

export function applyWebsiteScrollStats(
  offset: number,
  page: HTMLElement,
  prev: WebScrollVarState,
  heroPaused = false,
) {
  const pageScroll = getWebsitePageScrollProgress(offset);
  const belowScroll = getWebsiteBelowScrollProgress(offset);
  const navSurfaceRaw = getWebsiteNavSurface(offset);
  const navSurface = Math.round(navSurfaceRaw / NAV_SURFACE_STEP) * NAV_SURFACE_STEP;

  if (Math.abs(offset - prev.scrollOffset) > VAR_EPSILON) {
    page.style.setProperty("--web-scroll-offset", String(offset));
    prev.scrollOffset = offset;
  }

  if (!heroPaused) {
    const introBlend = getWebsiteAnimationBlend(offset);
    const skyBlend = getWebsiteSkyBlend(offset);

    if (Math.abs(introBlend - prev.introBlend) > VAR_EPSILON) {
      page.style.setProperty("--web-intro-blend", String(introBlend));
      prev.introBlend = introBlend;
    }
    if (Math.abs(skyBlend - prev.skyBlend) > VAR_EPSILON) {
      page.style.setProperty("--web-sky-blend", String(skyBlend));
      page.style.setProperty("--web-day-blend", String(skyBlend));
      prev.skyBlend = skyBlend;
    }
  }

  if (Math.abs(pageScroll - prev.pageScroll) > VAR_EPSILON) {
    page.style.setProperty("--web-page-scroll", String(pageScroll));
    prev.pageScroll = pageScroll;
  }
  if (Math.abs(belowScroll - prev.belowScroll) > VAR_EPSILON) {
    page.style.setProperty("--web-below-scroll", String(belowScroll));
    prev.belowScroll = belowScroll;

    const rangePx = readBelowScrollRangePx(page);
    const belowScrollPx = belowScroll * rangePx;
    if (Math.abs(belowScrollPx - prev.belowScrollPx) > 0.5) {
      page.style.setProperty("--web-below-scroll-px", `${belowScrollPx}px`);
      prev.belowScrollPx = belowScrollPx;
    }
  }
  if (Math.abs(navSurface - prev.navSurface) > VAR_EPSILON) {
    page.style.setProperty("--web-nav-surface", String(navSurface));
    page.classList.toggle("web-nav--surfaced", navSurface > 0.02);
    prev.navSurface = navSurface;
  }

  const orbitReady =
    offset < WEBSITE_PAGE_LIFT_START - ORBIT_READY_EPS;
  websiteTowerOrbit.canOrbit = orbitReady;
  if (orbitReady !== prev.orbitReady) {
    document.documentElement.classList.toggle("web-hero-orbit-ready", orbitReady);
    prev.orbitReady = orbitReady;
  }
}
