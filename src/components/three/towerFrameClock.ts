import { getSharedYawOffset } from "./towerSharedRotation";

/** One shared yaw sample per animation frame (both towers read the same value) */
let frameSampleMs = -1;
let frameYawOffset = 0;

export function sampleSharedYawThisFrame(isDragging: boolean): number {
  const now = performance.now();
  if (now !== frameSampleMs) {
    frameSampleMs = now;
    frameYawOffset = getSharedYawOffset(isDragging);
  }
  return frameYawOffset;
}

export function resetYawFrameSample() {
  frameSampleMs = -1;
}
