import { clamp } from "@/lib/mathx";

import { WEBSITE_HERO_IDLE_YAW } from "./websiteHeroScroll";

/** Full 360° horizontal drag — tower yaw on top of scroll tracking */
export const WEBSITE_DRAG_YAW_RANGE = Math.PI * 2;
/** @deprecated Use WEBSITE_DRAG_YAW_RANGE */
export const WEBSITE_DRAG_YAW_HALF = WEBSITE_DRAG_YAW_RANGE / 2;
/** Up to 28° vertical drag — camera elevation above default only */
export const WEBSITE_DRAG_CAMERA_PITCH_HALF = (28 * Math.PI) / 180;

export const websiteTowerOrbit = {
  dragging: false,
  canOrbit: false,
  yawOffset: 0,
  pitchOffset: 0,
  /** Updated each frame — sky sun tracks this, not scroll-commanded yaw */
  lastRenderedYaw: WEBSITE_HERO_IDLE_YAW,
};

export function clampWebsiteDragYaw(offset: number): number {
  const half = WEBSITE_DRAG_YAW_RANGE / 2;
  return clamp(offset, -half, half);
}

/** Camera pitch offset — 0 at rest, positive = look from higher angle only */
export function clampWebsiteCameraPitch(offset: number): number {
  return clamp(offset, 0, WEBSITE_DRAG_CAMERA_PITCH_HALF);
}

/** @deprecated Use clampWebsiteCameraPitch */
export function clampWebsiteDragPitch(offset: number): number {
  return clampWebsiteCameraPitch(offset);
}

export function resetWebsiteTowerOrbit() {
  websiteTowerOrbit.dragging = false;
  websiteTowerOrbit.canOrbit = false;
  websiteTowerOrbit.yawOffset = 0;
  websiteTowerOrbit.pitchOffset = 0;
  websiteTowerOrbit.lastRenderedYaw = WEBSITE_HERO_IDLE_YAW;
}

/** Preserve current pose when picking up a drag */
export function syncWebsiteDragFromRenderedYaw(trackingYaw: number) {
  websiteTowerOrbit.yawOffset =
    websiteTowerOrbit.lastRenderedYaw - trackingYaw;
}

/** @deprecated Use clampWebsiteDragYaw */
export function clampWebsiteDragOffset(offset: number): number {
  return clampWebsiteDragYaw(offset);
}
