import * as THREE from "three";

/** No intro buffer — static hero should respond immediately */
export const WEBSITE_INTRO_PAGE_COUNT = 0;

/** Full-day hold after choreography — not used on the static hero */
export const WEBSITE_HOLD_PAGE_COUNT = 0;

/** Total scroll pages — intro + page-lift + below-content */
export const WEBSITE_SCROLL_PAGES = 5;

/** Extra yaw past one full lap at orbit end — tower finishes slightly past 360° before handoff */
export const WEBSITE_ORBIT_OVERSHOOT = 0.025;

/** Normalized offset where night → day + tower choreography reaches 1 */
export const WEBSITE_CHOREOGRAPHY_END =
  WEBSITE_INTRO_PAGE_COUNT / WEBSITE_SCROLL_PAGES;

/** Normalized offset where hero lifts off and vision handoff begins */
export const WEBSITE_PAGE_LIFT_START =
  (WEBSITE_INTRO_PAGE_COUNT + WEBSITE_HOLD_PAGE_COUNT) / WEBSITE_SCROLL_PAGES;

/** @deprecated Page lift starts here — not at choreography end */
export const WEBSITE_INTRO_END = WEBSITE_PAGE_LIFT_START;

/** Normalized offset where tower + sun orbit reach 1 (intro + hold) */
export const WEBSITE_ORBIT_END = WEBSITE_PAGE_LIFT_START;

/** @deprecated Use WEBSITE_ORBIT_END */
export const WEBSITE_ROTATION_END = WEBSITE_ORBIT_END;

/** Hero copy reveal tracks the same intro + hold choreography */
export const WEBSITE_ANIMATION_END = WEBSITE_ORBIT_END;

/** Normalized intro offset where sky reaches full day blue */
export const WEBSITE_SKY_DAY_END = WEBSITE_INTRO_END * 0.44;

/** Intro span where blue sunlight intensifies on the tower — compressed for a faster ramp */
export const WEBSITE_SKY_GOLDEN_START = WEBSITE_INTRO_END * 0.04;
export const WEBSITE_SKY_GOLDEN_END = WEBSITE_INTRO_END * 0.48;

/** Normalized intro offset where sky reaches full day blue — before tower arc ends */
export const WEBSITE_SKY_ANIMATION_END = WEBSITE_SKY_DAY_END;

const PAGE_SLIDE_SHARE = 0.38;

function clamp01(t: number) {
  return THREE.MathUtils.clamp(t, 0, 1);
}

export function getWebsiteIntroScrollOffset(scrollOffset: number) {
  return Math.min(scrollOffset, WEBSITE_ORBIT_END);
}

/** Intro scroll fraction where sky + sun disc reach full day (tower keeps full arc) */
export const WEBSITE_SKY_DAY_COMPLETE = 0.68;

/** 0→1 tower / sun / sky arc — intro + hold, completes before page lift */
export function getWebsiteAnimationBlend(scrollOffset: number): number {
  return getWebsiteOrbitBlend(scrollOffset);
}

function flowEase(t: number): number {
  return THREE.MathUtils.smootherstep(clamp01(t), 0, 1);
}

/** 0→1 night → day — locked to the same smooth orbit curve */
export function getWebsiteSkyChoreographyBlend(scrollOffset: number): number {
  return getWebsiteOrbitBlend(scrollOffset);
}

/** 0→1 full sun orbit — intro + hold, before page lift */
export function getWebsiteOrbitBlend(scrollOffset: number): number {
  if (WEBSITE_PAGE_LIFT_START <= 0) return 1;
  return flowEase(scrollOffset / WEBSITE_PAGE_LIFT_START);
}

/** Unified 0→1 — same span as orbit; night → day along the 360° lap */
export function getWebsiteSkySolarBlend(scrollOffset: number): number {
  return getWebsiteOrbitBlend(scrollOffset);
}

/** 0→1 tower yaw + night→day sky — same span as animation blend */
export function getWebsiteRotationBlend(scrollOffset: number): number {
  return getWebsiteAnimationBlend(scrollOffset);
}

/** 0→1 lighting ramp — follows the same night → day curve */
export function getWebsiteLightBlend(scrollOffset: number): number {
  return getWebsiteSkyChoreographyBlend(scrollOffset);
}

/** 0→1 night → day sky color */
export function getWebsiteSkyDayBlend(scrollOffset: number): number {
  return getWebsiteSkyChoreographyBlend(scrollOffset);
}

/** @deprecated Golden hour removed — same curve as day blend */
export function getWebsiteSkyGoldenBlend(scrollOffset: number): number {
  return getWebsiteSkyChoreographyBlend(scrollOffset);
}

/** 0→1 sky color along intro scroll */
export function getWebsiteSkyColorBlend(scrollOffset: number): number {
  return getWebsiteSkyDayBlend(scrollOffset);
}

function getPostIntroPhase(scrollOffset: number) {
  const span = 1 - WEBSITE_PAGE_LIFT_START;
  if (span <= 0) return 0;
  return clamp01((scrollOffset - WEBSITE_PAGE_LIFT_START) / span);
}

/** 0→1 — slides the fixed hero + canvas off screen */
export function getWebsitePageScrollProgress(scrollOffset: number) {
  return Math.min(1, getPostIntroPhase(scrollOffset) / PAGE_SLIDE_SHARE);
}

/** 0→1 — scrolls ROI / compare / CTA once the hero has cleared */
export function getWebsiteBelowScrollProgress(scrollOffset: number) {
  const phase = getPostIntroPhase(scrollOffset);
  if (phase <= PAGE_SLIDE_SHARE) return 0;
  return (phase - PAGE_SLIDE_SHARE) / (1 - PAGE_SLIDE_SHARE);
}

/** Inverse of getWebsiteBelowScrollProgress — preserves pixel travel when range is remeasured */
export function getWebsiteOffsetFromBelowScrollProgress(belowScroll: number) {
  const b = clamp01(belowScroll);
  const postIntroPhase = PAGE_SLIDE_SHARE + b * (1 - PAGE_SLIDE_SHARE);
  const span = 1 - WEBSITE_PAGE_LIFT_START;
  return WEBSITE_PAGE_LIFT_START + postIntroPhase * span;
}

/** 0→1 — hero copy motion (opacity stays 1; drives translate + blur only) */
export function getWebsiteHeroReveal(scrollOffset: number) {
  const t = getWebsiteSkySolarBlend(scrollOffset);
  return THREE.MathUtils.smootherstep(t, 0.02, 0.78);
}

/** 0→1 — frosted bar after orbit completes; full shortly after page lift */
export function getWebsiteNavSurface(scrollOffset: number): number {
  const start = WEBSITE_PAGE_LIFT_START;
  if (scrollOffset <= start) return 0;

  const rampSpan = 1 / WEBSITE_SCROLL_PAGES;
  const fullAt = start + rampSpan;
  if (scrollOffset >= fullAt) return 1;

  return THREE.MathUtils.smootherstep(
    (scrollOffset - start) / (fullAt - start),
    0,
    1
  );
}

/** @deprecated Partners band is always full height in the hero layout */
export function getWebsiteHeroLift(_scrollOffset: number): number {
  return 1;
}

/** @deprecated Partners are always in-band at full height */
export function getWebsitePartnersReveal(_scrollOffset: number): number {
  return 1;
}
