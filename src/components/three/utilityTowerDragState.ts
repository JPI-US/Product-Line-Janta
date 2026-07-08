import {
  clampSharedDragYaw,
  towerSharedRotation,
  TOWER_YAW_HALF_RANGE,
} from "./towerSharedRotation";

/** Utility canvas drag-to-rotate UI state */
export const utilityTowerDragState = {
  dragging: false,
  canRotate: false,
};

export function clampUtilityDragYaw(yaw: number): number {
  return clampSharedDragYaw(yaw);
}

export function getUtilityDragYaw(): number {
  return clampSharedDragYaw(towerSharedRotation.yaw);
}

export { TOWER_YAW_HALF_RANGE as UTILITY_DRAG_YAW_HALF_RANGE };
