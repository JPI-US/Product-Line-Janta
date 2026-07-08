import * as THREE from "three";
import {
  solarAzimuthDegFromDirection,
  solarAzimuthDegFromTowerYaw,
} from "../../lib/solarTowerYaw";
import { SCENE } from "../../components/three/sceneConfig";
import { WEBSITE_ORBIT_OVERSHOOT } from "./websiteScrollConfig";
import { WEBSITE_SCENE } from "./websiteSceneConfig";

const sunPosScratch = new THREE.Vector3();

const TRACKING_LUT_SAMPLES = 256;
let trackingYawLut: Float64Array | null = null;

function getTowerYawFromAzimuthRad(
  azRad: number,
  panelNormalYaw: number = SCENE.tower.yawOffset
): number {
  const sunX = Math.sin(azRad);
  const sunZ = Math.cos(azRad);
  const n0x = Math.sin(panelNormalYaw);
  const n0z = Math.cos(panelNormalYaw);
  return Math.atan2(
    sunX * n0z - sunZ * n0x,
    sunZ * n0z + sunX * n0x
  );
}

/** Hero rest pose — left side profile at orbit start (sun west, blend 0) */
export const WEBSITE_HERO_IDLE_YAW = getTowerYawFromAzimuthRad(
  WEBSITE_SCENE.sun.azimuthStart
);

/** Integrate shortest yaw steps along a continuous sun azimuth lap — one tower turn + slight overshoot */
function buildTrackingYawLut(): Float64Array {
  const lut = new Float64Array(TRACKING_LUT_SAMPLES + 1);
  const azStart = WEBSITE_SCENE.sun.azimuthStart;
  const lap = Math.PI * 2 * (1 + WEBSITE_ORBIT_OVERSHOOT);
  lut[0] = getTowerYawFromAzimuthRad(azStart);
  let prevWrapped = lut[0];

  for (let i = 1; i <= TRACKING_LUT_SAMPLES; i++) {
    const az = azStart + (i / TRACKING_LUT_SAMPLES) * lap;
    const wrapped = getTowerYawFromAzimuthRad(az);
    let delta = wrapped - prevWrapped;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    lut[i] = lut[i - 1] + delta;
    prevWrapped = wrapped;
  }

  return lut;
}

function getTrackingYawLut(): Float64Array {
  if (!trackingYawLut) trackingYawLut = buildTrackingYawLut();
  return trackingYawLut;
}

/** Interpolate along the pre-unwrapped yaw path — no ±π snaps */
export function getWebsiteHeroTrackingYaw(cycleBlend: number): number {
  const t = THREE.MathUtils.clamp(cycleBlend, 0, 1);
  if (t <= 0) return WEBSITE_HERO_IDLE_YAW;

  const lut = getTrackingYawLut();
  const f = t * TRACKING_LUT_SAMPLES;
  const i0 = Math.floor(f);
  const i1 = Math.min(i0 + 1, TRACKING_LUT_SAMPLES);
  const frac = f - i0;
  return THREE.MathUtils.lerp(lut[i0], lut[i1], frac);
}

/** Lerp rotation.y toward a target without taking the long way around */
export function lerpTowerYaw(
  current: number,
  target: number,
  alpha: number
): number {
  const delta =
    THREE.MathUtils.euclideanModulo(target - current + Math.PI, Math.PI * 2) -
    Math.PI;
  return current + delta * alpha;
}

/** Unwrapped sun azimuth — one full lap plus handoff overshoot */
function getSunAzimuthRad(cycleBlend: number): number {
  const { azimuthStart } = WEBSITE_SCENE.sun;
  const lap = Math.PI * 2 * (1 + WEBSITE_ORBIT_OVERSHOOT);
  return azimuthStart + THREE.MathUtils.clamp(cycleBlend, 0, 1) * lap;
}

/**
 * Elevation rises smoothly along the orbit — night below horizon → cruise height at day.
 */
export function getWebsiteHeroSunElevation(cycleBlend: number): number {
  const { elevationStart, elevationEnd } = WEBSITE_SCENE.sun;
  const t = THREE.MathUtils.smootherstep(THREE.MathUtils.clamp(cycleBlend, 0, 1), 0, 1);
  return THREE.MathUtils.lerp(elevationStart, elevationEnd, t);
}

export function getWebsiteHeroSunPosition(
  cycleBlend: number,
  towerX: number = WEBSITE_SCENE.tower.offsetX,
  target = sunPosScratch
): THREE.Vector3 {
  const az = getSunAzimuthRad(cycleBlend);
  const { orbitRadius } = WEBSITE_SCENE.sun;
  const elev = getWebsiteHeroSunElevation(cycleBlend);
  target.set(
    towerX + orbitRadius * Math.sin(az),
    elev,
    orbitRadius * Math.cos(az)
  );
  return target;
}

export function getWebsiteHeroSunAngles(
  cycleBlend: number,
  towerX: number = WEBSITE_SCENE.tower.offsetX,
  focusY: number = WEBSITE_SCENE.towerFocus.y
): { azimuthDeg: number; altitudeDeg: number } {
  const sun = getWebsiteHeroSunPosition(cycleBlend, towerX);
  const dx = sun.x - towerX;
  const dz = sun.z;
  const horizontal = Math.hypot(dx, dz);
  const azimuthDeg = solarAzimuthDegFromDirection(dx, dz);
  const altitudeDeg = THREE.MathUtils.radToDeg(
    Math.atan2(sun.y - focusY, Math.max(horizontal, 0.001))
  );
  return { azimuthDeg, altitudeDeg };
}

/**
 * Sky disc follows panel-facing azimuth — exits one screen edge and re-enters
 * the other during 360° tower rotation (no edge clamp / sticky pause).
 */
export function getWebsiteDisplaySunAngles(
  towerYaw: number,
  baseAltitudeDeg: number,
  cycleBlend: number
): {
  lightAzimuthDeg: number;
  skyAzimuthDeg: number;
  altitudeDeg: number;
  skyAltitudeDeg: number;
} {
  const lightAzimuthDeg = solarAzimuthDegFromTowerYaw(
    towerYaw,
    SCENE.tower.yawOffset
  );
  const altitudeDeg = THREE.MathUtils.clamp(baseAltitudeDeg, -6, 68);
  const skyFloor = THREE.MathUtils.lerp(
    18,
    10,
    THREE.MathUtils.smoothstep(cycleBlend, 0, 0.5)
  );
  const skyAltitudeDeg = Math.max(altitudeDeg, skyFloor);

  return {
    lightAzimuthDeg,
    skyAzimuthDeg: lightAzimuthDeg,
    altitudeDeg,
    skyAltitudeDeg,
  };
}

/** Sky period along the unified night → day orbit */
export function getWebsiteHeroSkyPeriod(
  cycleBlend: number
): "night" | "dawn" | "golden" | "day" {
  const t = THREE.MathUtils.clamp(cycleBlend, 0, 1);
  return t < 0.5 ? "night" : "day";
}
