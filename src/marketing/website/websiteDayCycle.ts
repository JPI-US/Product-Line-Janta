import * as THREE from "three";
import { solarAzimuthDegFromDirection } from "../../lib/solarTowerYaw";
import { WEBSITE_SCENE } from "./websiteSceneConfig";
import {
  getWebsiteRotationBlend,
  getWebsiteSkyChoreographyBlend,
} from "./websiteScrollConfig";
import { WEBSITE_PAGE_BG } from "./websiteData";

/** Hero / sky anchor — dark slate blue-gray */
export const WEBSITE_SKY_BG = "#243341";

/** Night dome — slightly darker slate (day sky unchanged) */
export const WEBSITE_SKY_NIGHT = {
  zenith: "#151f28",
  mid: "#1d2c38",
  horizon: "#264055",
} as const;

export const WEBSITE_SKY = {
  zenith: WEBSITE_SKY_BG,
  mid: "#2f4a5c",
  horizon: "#4a6578",
} as const;

/** Vision photo sky at top edge */
export const WEBSITE_VISION_SKY = "#64A2D8";

/** Day hero sky — deeper, more saturated blue */
export const WEBSITE_SKY_DAY = {
  zenith: "#2160B8",
  mid: "#2F7AD0",
  horizon: "#4898E0",
} as const;

/** Cool-blue tower lights — slate at intro, sky blue at peak */
export const WEBSITE_LIGHT_SLATE = WEBSITE_SKY_BG;
export const WEBSITE_LIGHT_SLATE_FILL = "#1e2e3a";
export const WEBSITE_LIGHT_SLATE_RIM = "#2f4a5c";
export const WEBSITE_LIGHT_BLUE_KEY = "#4a90d4";
export const WEBSITE_LIGHT_BLUE_FILL = "#2d5f8f";
export const WEBSITE_LIGHT_BLUE_RIM = "#5a9fd0";
/** Subtle warm bounce fill */
export const WEBSITE_LIGHT_WARM_GLOW = "#ffe9b8";
/** Visible yellow accent — punchy but blue key stays dominant */
export const WEBSITE_LIGHT_YELLOW = "#ffbf14";

export type WebsiteSkyState = {
  zenith: string;
  mid: string;
  horizon: string;
  fog: string;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  turbidity: number;
  rayleigh: number;
  sunVisualScale: number;
  ambientScale: number;
  keyColor: string;
  rimColor: string;
  fillColor: string;
  keyIntensity: number;
  rimIntensity: number;
  fillIntensity: number;
  accentIntensity: number;
  accentColor: string;
  yellowIntensity: number;
  yellowColor: string;
  ambientIntensity: number;
  exposure: number;
  envIntensity: number;
  sunGlowOpacity: number;
  sunCoreColor: string;
  sunGlowColor: string;
};

/** Stronger cool-blue sunlight as the intro finishes */
const DAY_LIT: WebsiteSkyState = {
  zenith: WEBSITE_SKY.zenith,
  mid: WEBSITE_SKY.mid,
  horizon: WEBSITE_SKY.horizon,
  fog: WEBSITE_SKY.horizon,
  hemiSky: "#5B9FD8",
  hemiGround: "#1e2e3a",
  hemiIntensity: 0.62,
  turbidity: 2.6,
  rayleigh: 2,
  sunVisualScale: 1.38,
  ambientScale: 1,
  keyColor: "#5a9fd8",
  rimColor: "#4a88c4",
  fillColor: "#3a6898",
  keyIntensity: 14.5,
  rimIntensity: 5.5,
  fillIntensity: 1.75,
  accentIntensity: 0.34,
  accentColor: WEBSITE_LIGHT_WARM_GLOW,
  yellowIntensity: 0.95,
  yellowColor: WEBSITE_LIGHT_YELLOW,
  ambientIntensity: 0.28,
  exposure: 1.44,
  envIntensity: 0.28,
  sunGlowOpacity: 0.96,
  sunCoreColor: "#fff0d8",
  sunGlowColor: "#ffbf14",
};

/** Near-black night — cool navy, no direct sun */
const NIGHT: WebsiteSkyState = {
  zenith: WEBSITE_SKY_NIGHT.zenith,
  mid: WEBSITE_SKY_NIGHT.mid,
  horizon: WEBSITE_SKY_NIGHT.horizon,
  fog: WEBSITE_SKY_NIGHT.mid,
  hemiSky: "#3a5a72",
  hemiGround: WEBSITE_SKY_NIGHT.zenith,
  hemiIntensity: 0.1,
  turbidity: 8,
  rayleigh: 0.5,
  sunVisualScale: 0,
  ambientScale: 0.18,
  keyColor: "#a8d0f0",
  rimColor: "#303848",
  fillColor: "#181c24",
  keyIntensity: 0,
  rimIntensity: 0.35,
  fillIntensity: 0.05,
  accentIntensity: 0.1,
  accentColor: "#ffbf14",
  yellowIntensity: 0.26,
  yellowColor: "#ffbf14",
  ambientIntensity: 0.03,
  exposure: 1,
  envIntensity: 0.12,
  sunGlowOpacity: 0,
  sunCoreColor: "#eef4ff",
  sunGlowColor: "#88b8e0",
};

function lerpHexHsl(a: string, b: string, t: number): string {
  const out = new THREE.Color();
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  const ha = { h: 0, s: 0, l: 0 };
  const hb = { h: 0, s: 0, l: 0 };
  ca.getHSL(ha);
  cb.getHSL(hb);

  let dh = hb.h - ha.h;
  if (dh > 0.5) dh -= 1;
  if (dh < -0.5) dh += 1;

  out.setHSL(
    (ha.h + dh * t + 1) % 1,
    ha.s + (hb.s - ha.s) * t,
    ha.l + (hb.l - ha.l) * t
  );
  return `#${out.getHexString()}`;
}

function lerpHex(a: string, b: string, t: number): string {
  const parse = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}

function lerpSky(a: WebsiteSkyState, b: WebsiteSkyState, t: number): WebsiteSkyState {
  const mix = (key: keyof Pick<WebsiteSkyState, "zenith" | "mid" | "horizon" | "fog">) =>
    lerpHexHsl(a[key], b[key], t);

  return {
    zenith: mix("zenith"),
    mid: mix("mid"),
    horizon: mix("horizon"),
    fog: mix("fog"),
    hemiSky: lerpHex(a.hemiSky, b.hemiSky, t),
    hemiGround: lerpHex(a.hemiGround, b.hemiGround, t),
    hemiIntensity: THREE.MathUtils.lerp(a.hemiIntensity, b.hemiIntensity, t),
    turbidity: THREE.MathUtils.lerp(a.turbidity, b.turbidity, t),
    rayleigh: THREE.MathUtils.lerp(a.rayleigh, b.rayleigh, t),
    sunVisualScale: THREE.MathUtils.lerp(a.sunVisualScale, b.sunVisualScale, t),
    ambientScale: THREE.MathUtils.lerp(a.ambientScale, b.ambientScale, t),
    keyColor: lerpHex(a.keyColor, b.keyColor, t),
    rimColor: lerpHex(a.rimColor, b.rimColor, t),
    fillColor: lerpHex(a.fillColor, b.fillColor, t),
    keyIntensity: THREE.MathUtils.lerp(a.keyIntensity, b.keyIntensity, t),
    rimIntensity: THREE.MathUtils.lerp(a.rimIntensity, b.rimIntensity, t),
    fillIntensity: THREE.MathUtils.lerp(a.fillIntensity, b.fillIntensity, t),
    accentIntensity: THREE.MathUtils.lerp(a.accentIntensity, b.accentIntensity, t),
    accentColor: lerpHex(a.accentColor, b.accentColor, t),
    yellowIntensity: THREE.MathUtils.lerp(a.yellowIntensity, b.yellowIntensity, t),
    yellowColor: lerpHex(a.yellowColor, b.yellowColor, t),
    ambientIntensity: THREE.MathUtils.lerp(a.ambientIntensity, b.ambientIntensity, t),
    exposure: THREE.MathUtils.lerp(a.exposure, b.exposure, t),
    envIntensity: THREE.MathUtils.lerp(a.envIntensity, b.envIntensity, t),
    sunGlowOpacity: THREE.MathUtils.lerp(a.sunGlowOpacity, b.sunGlowOpacity, t),
    sunCoreColor: lerpHex(a.sunCoreColor, b.sunCoreColor, t),
    sunGlowColor: lerpHex(a.sunGlowColor, b.sunGlowColor, t),
  };
}

function flowEase(t: number): number {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** 0→1 night → day along intro scroll */
export function getWebsiteSkyBlend(scrollOffset: number): number {
  return getWebsiteSkyChoreographyBlend(scrollOffset);
}

/** Fixed white sky dome colors */
export function getWebsiteSkyGradientState(
  _scrollOffset: number
): Pick<WebsiteSkyState, "zenith" | "mid" | "horizon"> {
  return { zenith: WEBSITE_PAGE_BG, mid: WEBSITE_PAGE_BG, horizon: WEBSITE_PAGE_BG };
}

function getWebsiteTowerBlend(scrollOffset: number): number {
  return flowEase(getWebsiteRotationBlend(scrollOffset));
}

/** 0→1 sun arc / tower tracking progress */
export function getWebsiteDayPhase(scrollOffset: number): number {
  return getWebsiteTowerBlend(scrollOffset);
}

/** Sun rises in sync with the night → day scroll curve */
export function getWebsiteSunVisibility(scrollOffset: number): number {
  const dayT = getWebsiteSkyChoreographyBlend(scrollOffset);
  const elev = getSunElevation(getWebsiteTowerBlend(scrollOffset));
  const aboveHorizon = THREE.MathUtils.smoothstep(elev, -6, 0.35);
  return aboveHorizon * dayT;
}

/** 0→1 tower lighting — same curve as sky */
export function getWebsiteLightVisibility(scrollOffset: number): number {
  return getWebsiteSkyChoreographyBlend(scrollOffset);
}

function getSunElevation(blend: number): number {
  const { elevationStart, elevationEnd } = WEBSITE_SCENE.sun;
  const t = THREE.MathUtils.smootherstep(THREE.MathUtils.clamp(blend, 0, 1), 0, 1);
  return THREE.MathUtils.lerp(elevationStart, elevationEnd, t);
}

/** 0→1 tower + scene lighting — same curve as sky */
export function getWebsiteGoldenHourBlend(scrollOffset: number): number {
  return getWebsiteSkyChoreographyBlend(scrollOffset);
}

export function getWebsiteSunPosition(
  scrollOffset: number,
  towerX: number = WEBSITE_SCENE.tower.offsetX,
  target = new THREE.Vector3()
): THREE.Vector3 {
  const blend = getWebsiteTowerBlend(scrollOffset);
  const { orbitRadius, azimuthStart, azimuthEnd } = WEBSITE_SCENE.sun;
  const az = THREE.MathUtils.lerp(azimuthStart, azimuthEnd, blend);
  const elev = getSunElevation(blend);

  target.set(
    towerX + orbitRadius * Math.sin(az),
    elev,
    orbitRadius * Math.cos(az)
  );
  return target;
}

/**
 * Solar angles for the living sky — same scroll arc as the tower + key light,
 * mapped to a higher visible altitude than raw world units.
 */
export function getWebsiteSkySolar(
  scrollOffset: number,
  towerX: number = WEBSITE_SCENE.tower.offsetX
): { azimuthDeg: number; altitudeDeg: number } {
  const sun = getWebsiteSunPosition(scrollOffset, towerX);
  const dx = sun.x - towerX;
  const dz = sun.z;
  const focusY = WEBSITE_SCENE.camera.lookAt.y;
  const horizontal = Math.hypot(dx, dz);
  const azimuthDeg = solarAzimuthDegFromDirection(dx, dz);
  const altitudeDeg = THREE.MathUtils.radToDeg(
    Math.atan2(sun.y - focusY, horizontal)
  );
  return { azimuthDeg, altitudeDeg };
}

export function getWebsiteSunDirection(
  scrollOffset: number,
  towerX: number = WEBSITE_SCENE.tower.offsetX,
  target = new THREE.Vector3()
): THREE.Vector3 {
  const sun = getWebsiteSunPosition(scrollOffset, towerX, target);
  const { x: focusX, y: focusY } = WEBSITE_SCENE.towerFocus;
  return target.copy(sun).sub(new THREE.Vector3(focusX, focusY, 0)).normalize();
}

/** Cool blue sunlight on the tower — single night → day lerp */
export function getWebsiteSkyState(scrollOffset: number): WebsiteSkyState {
  const t = getWebsiteSkyChoreographyBlend(scrollOffset);
  const sunT = getWebsiteSunVisibility(scrollOffset);
  const skyColors = getWebsiteSkyGradientState(scrollOffset);
  const state = lerpSky(NIGHT, DAY_LIT, t);

  return {
    ...state,
    ...skyColors,
    keyColor: lerpHex(WEBSITE_LIGHT_SLATE, WEBSITE_LIGHT_BLUE_KEY, t),
    rimColor: lerpHex(WEBSITE_LIGHT_SLATE_RIM, WEBSITE_LIGHT_BLUE_RIM, t),
    fillColor: lerpHex(WEBSITE_LIGHT_SLATE_FILL, WEBSITE_LIGHT_BLUE_FILL, t),
    accentColor: WEBSITE_LIGHT_WARM_GLOW,
    yellowColor: WEBSITE_LIGHT_YELLOW,
    sunGlowOpacity: state.sunGlowOpacity * sunT,
    sunVisualScale: state.sunVisualScale * sunT,
    sunCoreColor: lerpHex(NIGHT.sunCoreColor, DAY_LIT.sunCoreColor, t),
    sunGlowColor: lerpHex(NIGHT.sunGlowColor, DAY_LIT.sunGlowColor, t),
    hemiSky: lerpHex(skyColors.horizon, state.hemiSky, t),
    hemiGround: skyColors.zenith,
  };
}

export function isWebsiteSunUp(scrollOffset: number): boolean {
  return getWebsiteSunVisibility(scrollOffset) > 0.05;
}
