import type * as THREE from "three";
import type { SkyPeriod } from "../../data/hubChooserSky";
import { SCENE } from "./sceneConfig";

/** Fixed hero framing — one face toward camera; base/back hidden by fog + veil. */
export const HUB_TOWER = {
  towerX: SCENE.tower.offsetX,
  /** Camera look-at X — defaults to tower center; lower = tower reads further right */
  lookAtX: SCENE.tower.offsetX,
  lookAtY: SCENE.lookAtEnd.y,
  yawOffset: SCENE.tower.yawOffset,
  scaleMul: 4.05 / SCENE.tower.scale,
  yOffset: SCENE.tower.offsetYEnd - 1.75,
  defaultAzimuthDeg: 200,
  /** Below this solar altitude the hub tower stops tracking and holds stow. */
  stowAltitudeDeg: 0,
  /** Parked compass heading — north-facing stow (opposite of previous south stow). */
  stowAzimuthDeg: 0,
  camera: {
    offsetX: 0.05,
    offsetY: 0.48,
    offsetZ: 10.4,
    lookAtYFactor: 0.3,
    fov: 32,
  },
  fog: { near: 5.5, far: 18 },
  yawLerp: 0.07,
} as const;

export type HubTowerLayout = {
  towerX: number;
  lookAtX: number;
  lookAtY: number;
  yawOffset: number;
  scaleMul: number;
  yOffset: number;
  defaultAzimuthDeg: number;
  stowAltitudeDeg: number;
  stowAzimuthDeg: number;
  camera: {
    offsetX: number;
    offsetY: number;
    offsetZ: number;
    lookAtYFactor: number;
    fov: number;
  };
  fog: { near: number; far: number };
  yawLerp: number;
  /** Optional tuning for CSS sky sun projection */
  skySun?: {
    yCenter: number;
    yVertScale: number;
    wrapHorizontal?: boolean;
    /** Nudge disc right (+) / left (−) as a fraction of viewport width */
    xBias?: number;
  };
};

/** Optional scroll-driven pose — used by the marketing hero */
export type HubTowerScrollDriver = {
  getYaw: () => number;
  getSunDirection: (target: THREE.Vector3) => THREE.Vector3;
  isAnimating: () => boolean;
  /** 0 = night, 1 = day — drives smooth material + light blend */
  getScrollBlend?: () => number;
  getSkyPeriod?: () => SkyPeriod;
  /** Marketing hero — instant yaw while pointer-dragging */
  getOrbitDragging?: () => boolean;
  /** Scroll-choreographed sky stops — avoids DOM style reads in WebGL */
  getSkyStops?: () => { zenith: string; mid: string; horizon: string };
};
