import { SCENE } from "./sceneConfig";
import {
  clampIdleYaw,
  startIdleClock,
  stopIdleClock,
  tickIdleYawOffset,
  TOWER_IDLE_PENDULUM_PERIOD_S,
} from "./towerIdleRotation";

export { TOWER_IDLE_PENDULUM_PERIOD_S };

/** ±90° — shared by Designer and Utility tower */
export const TOWER_YAW_HALF_RANGE = Math.PI / 2;

/** Single yaw / idle timeline for both product canvases */
export const towerSharedRotation = {
  yaw: 0,
  idleCenterYaw: SCENE.tower.idleYawCenter,
  idlePhaseOffset: 0,
  idleEpochMs: null as number | null,
  dragging: false,
  canRotate: false,
};

export function clampSharedDragYaw(yaw: number): number {
  return clampIdleYaw(yaw, TOWER_YAW_HALF_RANGE);
}

/** Current idle/drag yaw offset — same value both towers must use */
export function getSharedYawOffset(isDragging: boolean): number {
  if (isDragging) {
    return clampSharedDragYaw(towerSharedRotation.yaw);
  }
  if (towerSharedRotation.idleEpochMs !== null) {
    return tickIdleYawOffset(towerSharedRotation, TOWER_YAW_HALF_RANGE);
  }
  return towerSharedRotation.idleCenterYaw;
}

const idleWakeListeners = new Set<() => void>();

export function subscribeTowerIdleWake(listener: () => void) {
  idleWakeListeners.add(listener);
  return () => idleWakeListeners.delete(listener);
}

function notifyIdleWake() {
  idleWakeListeners.forEach((listener) => listener());
}

export function ensureSharedIdleStarted(reducedMotion: boolean) {
  if (reducedMotion || towerSharedRotation.idleEpochMs !== null) return;
  startIdleClock(
    towerSharedRotation,
    towerSharedRotation.idleCenterYaw,
    TOWER_YAW_HALF_RANGE
  );
  notifyIdleWake();
}

export function resetSharedIdle() {
  stopIdleClock(towerSharedRotation, 0, TOWER_YAW_HALF_RANGE);
}
