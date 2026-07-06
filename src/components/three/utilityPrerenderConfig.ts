import * as THREE from "three";
import { TOWER_YAW_HALF_RANGE } from "./towerSharedRotation";

/** Baked utility tower rotation strip (see `npm run bake:utility-prerender`) */
export const UTILITY_PRERENDER = {
  frameCount: 48,
  width: 1280,
  height: 720,
  basePath: "/towers/utility-prerender",
  manifestUrl: "/towers/utility-prerender/manifest.json",
  framePattern: "frame-{index}.webp",
} as const;

export type UtilityPrerenderManifest = {
  frameCount: number;
  width: number;
  height: number;
  format: "webp" | "png";
  pattern: string;
  basePath: string;
};

export function formatPrerenderFrameName(index: number, pad = 3) {
  return `frame-${String(index).padStart(pad, "0")}.webp`;
}

export function getUtilityPrerenderFrameUrl(
  index: number,
  manifest?: Pick<UtilityPrerenderManifest, "basePath" | "pattern">
) {
  const base = manifest?.basePath ?? UTILITY_PRERENDER.basePath;
  const pattern =
    manifest?.pattern ?? UTILITY_PRERENDER.framePattern;
  const name = pattern.replace("{index}", String(index).padStart(3, "0"));
  return `${base}/${name}`;
}

/** Yaw offset for a baked frame index */
export function getUtilityPrerenderYawForFrame(
  frameIndex: number,
  frameCount: number = UTILITY_PRERENDER.frameCount,
  halfRange: number = TOWER_YAW_HALF_RANGE
): number {
  const t = frameCount <= 1 ? 0 : frameIndex / (frameCount - 1);
  return THREE.MathUtils.lerp(-halfRange, halfRange, t);
}

/** Map shared yaw offset (−π/2…π/2) to a frame index */
export function yawOffsetToPrerenderFrame(
  yawOffset: number,
  frameCount: number = UTILITY_PRERENDER.frameCount,
  halfRange: number = TOWER_YAW_HALF_RANGE
): number {
  const t = (yawOffset + halfRange) / (2 * halfRange);
  const idx = Math.round(t * (frameCount - 1));
  return Math.max(0, Math.min(frameCount - 1, idx));
}
