import * as THREE from "three";
import {
  getTowerYawFromSolarAzimuthDegrees,
  solarAzimuthDegFromDirection,
} from "../lib/solarTowerYaw";

/** Hub intro ends on this sky — product chooser uses the same gradient. */
export const HUB_SUNSET_GRADIENT =
  "linear-gradient(180deg, #4a3868 0%, #d86542 38%, #c44e38 58%, #2a1218 100%)";

export const HUB_SUNSET_BASE = "#2a1218";

export const HUB_SKY_BLUE_GRADIENT =
  "linear-gradient(180deg, #4a9ee8 0%, #8ec5f4 44%, #c5e3fa 100%)";

type SkyStops = { zenith: string; horizon: string; base: string };

const HUB_SKY_BLUE: SkyStops = {
  zenith: "#4a9ee8",
  horizon: "#8ec5f4",
  base: "#c5e3fa",
};

const HUB_SKY_SUNSET: SkyStops = {
  zenith: "#4a3868",
  horizon: "#e07048",
  base: "#2a1218",
};

function lerpChannel(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function lerpHex(hexA: string, hexB: string, t: number): string {
  const parse = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
  };
  const [ar, ag, ab] = parse(hexA);
  const [br, bg, bb] = parse(hexB);
  const r = lerpChannel(ar, br, t);
  const g = lerpChannel(ag, bg, t);
  const b = lerpChannel(ab, bb, t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function lerpSkyStops(a: SkyStops, b: SkyStops, t: number): SkyStops {
  return {
    zenith: lerpHex(a.zenith, b.zenith, t),
    horizon: lerpHex(a.horizon, b.horizon, t),
    base: lerpHex(a.base, b.base, t),
  };
}

function stopsToGradient(stops: SkyStops) {
  return `linear-gradient(180deg, ${stops.zenith} 0%, ${stops.horizon} 44%, ${stops.base} 100%)`;
}

export function getHubSkyStops(progress: number): SkyStops {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  return lerpSkyStops(HUB_SKY_BLUE, HUB_SKY_SUNSET, t);
}

export function getHubSkyCssGradient(progress: number): string {
  return stopsToGradient(getHubSkyStops(progress));
}

let skyBackdropEl: HTMLElement | null = null;

export function bindHubSkyBackdrop(el: HTMLElement | null) {
  skyBackdropEl = el;
}

function applyGradientToBackdrop(gradient: string) {
  if (!skyBackdropEl) return;
  skyBackdropEl.style.background = gradient;
  const stage = skyBackdropEl.closest(".hub__stage") as HTMLElement | null;
  const hub = skyBackdropEl.closest(".hub") as HTMLElement | null;
  if (stage) stage.style.background = gradient;
  if (hub) hub.style.background = gradient;
}

export function updateHubSkyBackdrop(progress: number) {
  const gradient = getHubSkyCssGradient(progress);
  applyGradientToBackdrop(gradient);
  document.documentElement.style.setProperty("--hub-sky-gradient", gradient);
}

export function freezeHubSkyAtSunset() {
  updateHubSkyBackdrop(1);
}

export const HUB_MONTAGE = {
  towerScale: 4.55,
  /** Lower in frame */
  towerYOffset: -0.65,
  durationSeconds: 8,
  sun: {
    /** 180° semicircle in front of tower (both sides shown as it tracks) */
    azimuthStart: -Math.PI / 2,
    azimuthEnd: Math.PI / 2,
    orbitRadius: 13.5,
    aboveTowerMin: 4.2,
    aboveTowerPeak: 8.8,
    visualRadius: 0.32,
    glowRadius: 1.05,
    glowOpacity: 0.22,
  },
  camera: {
    offsetX: 0.15,
    offsetY: 1.5,
    offsetZ: 11.5,
    lookAtYFactor: 0.55,
    fov: 34,
  },
} as const;

const sunScratch = new THREE.Vector3();
const camPosScratch = new THREE.Vector3();
const camLookScratch = new THREE.Vector3();

/**
 * Sun sweeps a 180° arc (left → front → right) above the tower.
 * Tower yaw tracks this exactly — one full face-to-face turn.
 */
export function getHubMontageSunPosition(
  progress: number,
  towerX: number,
  lookAtY: number,
  target = sunScratch
): THREE.Vector3 {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  const { sun } = HUB_MONTAGE;
  const az = THREE.MathUtils.lerp(sun.azimuthStart, sun.azimuthEnd, t);
  const towerTopY = lookAtY + 3.6;
  const dayArc = Math.sin(Math.PI * t);

  const sunX = towerX + sun.orbitRadius * Math.sin(az);
  const sunY =
    towerTopY +
    sun.aboveTowerMin +
    dayArc * (sun.aboveTowerPeak - sun.aboveTowerMin);
  const sunZ = sun.orbitRadius * Math.cos(az);

  target.set(sunX, sunY, sunZ);
  return target;
}

export function getHubMontageTowerYaw(
  progress: number,
  towerX: number,
  lookAtY: number,
  _yawOffset = Math.PI
): number {
  const sun = getHubMontageSunPosition(progress, towerX, lookAtY, sunScratch);
  const dx = sun.x - towerX;
  const dz = sun.z;
  return getTowerYawFromSolarAzimuthDegrees(
    solarAzimuthDegFromDirection(dx, dz)
  );
}

export function getHubMontageThreeColors(progress: number) {
  const stops = getHubSkyStops(progress);
  return {
    zenith: new THREE.Color().setStyle(stops.zenith),
    horizon: new THREE.Color().setStyle(stops.horizon),
    base: new THREE.Color().setStyle(stops.base),
  };
}

export function getHubMontageCamera(towerX: number, lookAtY: number) {
  const { camera } = HUB_MONTAGE;
  const position = camPosScratch.set(
    towerX + camera.offsetX,
    camera.offsetY,
    camera.offsetZ
  );
  const lookAt = camLookScratch.set(
    towerX,
    lookAtY * camera.lookAtYFactor,
    0
  );
  return {
    position,
    lookAt,
    fov: camera.fov,
  };
}
