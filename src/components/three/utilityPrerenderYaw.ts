import { isAnyTowerDragging } from "./towerDragSync";
import {
  getSharedYawOffset,
  TOWER_YAW_HALF_RANGE,
} from "./towerSharedRotation";
import {
  UTILITY_PRERENDER,
  yawOffsetToPrerenderFrame,
} from "./utilityPrerenderConfig";

export function getUtilityPrerenderFrameIndex(
  frameCount: number = UTILITY_PRERENDER.frameCount
): number {
  const yaw = getSharedYawOffset(isAnyTowerDragging());
  return yawOffsetToPrerenderFrame(yaw, frameCount, TOWER_YAW_HALF_RANGE);
}
