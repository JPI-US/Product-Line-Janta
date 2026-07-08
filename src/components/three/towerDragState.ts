import {
  clampSharedDragYaw,
  towerSharedRotation,
  TOWER_YAW_HALF_RANGE,
} from "./towerSharedRotation";

/** Designer canvas drag-to-rotate UI state */
export const towerDragState = {
  dragging: false,
  canRotate: false,
};

export function clampTowerDragYaw(yaw: number): number {
  return clampSharedDragYaw(yaw);
}

export function getTowerDragYaw(): number {
  return clampSharedDragYaw(towerSharedRotation.yaw);
}

export { TOWER_YAW_HALF_RANGE as TOWER_DRAG_YAW_HALF_RANGE };
