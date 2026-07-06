import * as THREE from "three";
import {
  getTowerYawFromSolarAzimuthDegrees,
  solarAzimuthDegFromDirection,
} from "../../lib/solarTowerYaw";
import { ANIMATION_SCROLL_END, SCENE } from "./sceneConfig";
import { isIntroAnimationComplete } from "./infoReveal";
import { sampleSharedYawThisFrame } from "./towerFrameClock";

const sunPosScratch = new THREE.Vector3();

const towerFocus = new THREE.Vector3(
  SCENE.tower.offsetX,
  SCENE.lookAtEnd.y,
  0
);

/** 0→1 progress for tower/sun/camera (stops when animation completes) */
export function getScrollBlend(scrollOffset: number): number {
  const t = Math.min(scrollOffset / ANIMATION_SCROLL_END, 1);
  const { start, end } = SCENE.rotationScroll;
  return THREE.MathUtils.smoothstep(t, start, end);
}

export function getSunAzimuth(blend: number, panelYawOffset = 0): number {
  return (
    THREE.MathUtils.lerp(
      SCENE.sun.azimuthStart,
      SCENE.sun.azimuthEnd,
      blend
    ) + panelYawOffset
  );
}

export function getSunPosition(
  blend: number,
  towerX: number = SCENE.tower.offsetX,
  target = sunPosScratch,
  panelYawOffset = 0
): THREE.Vector3 {
  const az = getSunAzimuth(blend, panelYawOffset);
  const { orbitRadius, elevation } = SCENE.sun;
  target.set(
    towerX + orbitRadius * Math.sin(az),
    elevation,
    orbitRadius * Math.cos(az)
  );
  return target;
}

export function getTowerYawTowardSun(
  blend: number,
  towerX: number = SCENE.tower.offsetX,
  panelYawOffset = 0,
  _yawOffset: number = SCENE.tower.yawOffset
): number {
  const sun = getSunPosition(blend, towerX, sunPosScratch, panelYawOffset);
  const dx = sun.x - towerX;
  const dz = sun.z;
  return getTowerYawFromSolarAzimuthDegrees(
    solarAzimuthDegFromDirection(dx, dz)
  );
}

/** Split-view pose at panelYawOffset 0 (seam/corner); idle/drag offsets are added on top */
export function getSplitViewBaseYaw(
  blend: number,
  towerX: number = SCENE.tower.offsetX,
  _modelYawOffset: number = SCENE.tower.yawOffset
): number {
  return getTowerYawTowardSun(blend, towerX, 0);
}

export function applySplitViewYawOffset(
  baseYaw: number,
  yawOffset: number,
  halfRange: number
): number {
  return (
    baseYaw +
    THREE.MathUtils.clamp(yawOffset, -halfRange, halfRange)
  );
}

/** Yaw offset for Designer split view / sun — 0 until intro ends */
export function getTowerVisualYawOffset(
  scrollOffset: number,
  isDragging: boolean
): number {
  if (!isIntroAnimationComplete(scrollOffset)) return 0;
  return sampleSharedYawThisFrame(isDragging);
}

/** Yaw offset for Utility tower — same shared idle timeline as designer */
export function getUtilityVisualYawOffset(
  isDragging: boolean,
  scrollOffset?: number
): number {
  if (
    scrollOffset !== undefined &&
    !isIntroAnimationComplete(scrollOffset)
  ) {
    return 0;
  }
  return sampleSharedYawThisFrame(isDragging);
}

export function getTowerLightTarget(
  towerX: number = SCENE.tower.offsetX,
  lookAtY: number = SCENE.lookAtEnd.y
): THREE.Vector3 {
  towerFocus.set(towerX, lookAtY, 0);
  return towerFocus;
}

/** Split-view sun progress (full tracking range for static product sections) */
export const SUN_TRACK_BLEND_END = 1;
