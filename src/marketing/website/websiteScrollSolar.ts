import * as THREE from "three";
import { getSunDirectionFromAzimuthDegrees } from "../../lib/hubTowerAzimuth";
import { type HubSolarCoords } from "../../lib/hubSolarSample";
import { getWebsiteOrbitBlend, getWebsiteSkyChoreographyBlend } from "./websiteScrollConfig";
import {
  getWebsiteDisplaySunAngles,
  getWebsiteHeroSunAngles,
  getWebsiteHeroTrackingYaw,
} from "./websiteHeroScroll";
import {
  clampWebsiteCameraPitch,
  websiteTowerOrbit,
} from "./websiteTowerOrbit";

function getWebsiteIntroNightDate(ref: Date): Date {
  const d = new Date(ref);
  d.setHours(2, 30, 0, 0);
  return d;
}

function getWebsiteIntroDayDate(ref: Date): Date {
  const d = new Date(ref);
  d.setHours(10, 45, 0, 0);
  return d;
}

function lerpDate(startAt: Date, endAt: Date, t: number): Date {
  return new Date(startAt.getTime() + (endAt.getTime() - startAt.getTime()) * t);
}

export type WebsiteScrollSolarState = {
  /** Sky disc azimuth — kept visible during tower rotation */
  azimuthDeg: number;
  /** 3D sun direction — tracks panel-facing azimuth */
  lightAzimuthDeg: number;
  altitudeDeg: number;
  skyAltitudeDeg: number;
  simulatedAt: Date;
  towerYaw: number;
  trackingYaw: number;
  tracking: boolean;
  /** Unified 0→1 night → day + full orbit */
  scrollBlend: number;
  orbitBlend: number;
  /** Faster 0→1 ramp for CSS / living sky */
  skyBlend: number;
};

/** Shared 0→1 ramp for scroll sun brightness + tower materials */
export function getWebsiteScrollLightBlend(scrollBlend: number): number {
  return THREE.MathUtils.clamp(scrollBlend, 0, 1);
}

let scrollSolarCache: {
  key: string;
  state: WebsiteScrollSolarState;
} | null = null;

function scrollSolarCacheKey(scrollOffset: number): string {
  return [
    scrollOffset.toFixed(6),
    websiteTowerOrbit.lastRenderedYaw.toFixed(4),
    websiteTowerOrbit.yawOffset.toFixed(4),
    websiteTowerOrbit.pitchOffset.toFixed(4),
    websiteTowerOrbit.dragging ? "1" : "0",
  ].join("|");
}

/**
 * One smooth 360° cycle: tower tracks scroll sun; display sun stays in front of panels.
 */
export function getWebsiteScrollSolarState(
  scrollOffset: number,
  _coords: HubSolarCoords | null,
  _previewDate: Date | null
): WebsiteScrollSolarState {
  const cacheKey = scrollSolarCacheKey(scrollOffset);
  if (scrollSolarCache?.key === cacheKey) {
    return scrollSolarCache.state;
  }

  const cycleBlend = getWebsiteOrbitBlend(scrollOffset);
  const skyBlend = getWebsiteSkyChoreographyBlend(scrollOffset);
  const calendarRef = new Date();
  const simulatedAt = lerpDate(
    getWebsiteIntroNightDate(calendarRef),
    getWebsiteIntroDayDate(calendarRef),
    skyBlend
  );

  const { altitudeDeg: scrollAltitude } = getWebsiteHeroSunAngles(skyBlend);

  const trackingYaw = getWebsiteHeroTrackingYaw(cycleBlend);
  const yawOffset = websiteTowerOrbit.yawOffset;
  const commandedTowerYaw = trackingYaw + yawOffset;
  const renderedYaw = websiteTowerOrbit.lastRenderedYaw;
  const sunFacingYaw =
    cycleBlend > 0.001 ||
    websiteTowerOrbit.dragging ||
    Math.abs(yawOffset) > 0.002
      ? renderedYaw || commandedTowerYaw
      : commandedTowerYaw;

  const display = getWebsiteDisplaySunAngles(
    sunFacingYaw,
    scrollAltitude,
    skyBlend
  );
  const cameraPitch = clampWebsiteCameraPitch(websiteTowerOrbit.pitchOffset);
  const yawDelta = Math.abs(
    THREE.MathUtils.euclideanModulo(
      commandedTowerYaw - renderedYaw + Math.PI,
      Math.PI * 2
    ) - Math.PI
  );

  const animating =
    websiteTowerOrbit.dragging ||
    Math.abs(yawOffset) > 0.002 ||
    Math.abs(cameraPitch) > 0.002 ||
    yawDelta > 0.008;

  const state: WebsiteScrollSolarState = {
    azimuthDeg: display.skyAzimuthDeg,
    lightAzimuthDeg: display.lightAzimuthDeg,
    altitudeDeg: display.altitudeDeg,
    skyAltitudeDeg: display.skyAltitudeDeg,
    simulatedAt,
    towerYaw: commandedTowerYaw,
    trackingYaw,
    tracking: animating,
    scrollBlend: cycleBlend,
    orbitBlend: cycleBlend,
    skyBlend,
  };
  scrollSolarCache = { key: cacheKey, state };
  return state;
}

export function getWebsiteScrollSunDirection(
  scrollOffset: number,
  coords: HubSolarCoords | null,
  previewDate: Date | null,
  target = new THREE.Vector3()
): THREE.Vector3 {
  const { lightAzimuthDeg, altitudeDeg } = getWebsiteScrollSolarState(
    scrollOffset,
    coords,
    previewDate
  );
  return getSunDirectionFromAzimuthDegrees(lightAzimuthDeg, altitudeDeg, target);
}
