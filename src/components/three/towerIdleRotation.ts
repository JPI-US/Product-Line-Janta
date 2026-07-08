import * as THREE from "three";

/** Full −rail → +rail → −rail cycle (both legs same duration = matched swivel speed) */
export const TOWER_IDLE_PENDULUM_PERIOD_S = 96;

export type TowerIdleState = {
  yaw: number;
  /** Yaw offset when idle was started (e.g. after drag release) */
  idleCenterYaw: number;
  /** Starting point in [0,1) cycle — release pose + direction toward opposite rail */
  idlePhaseOffset: number;
  idleEpochMs: number | null;
  dragging: boolean;
  canRotate: boolean;
};

export function clampIdleYaw(yaw: number, halfRange: number): number {
  return THREE.MathUtils.clamp(yaw, -halfRange, halfRange);
}

/** 0→1→0 triangle — constant speed, reverses immediately at each rail */
function triangleWave01(cycle: number): number {
  const t = cycle - Math.floor(cycle);
  return t < 0.5 ? t * 2 : 2 - t * 2;
}

/**
 * Cycle offset so release pose matches the triangle and motion heads to the opposite rail.
 */
function cycleOffsetForRelease(yawOffset: number, halfRange: number): number {
  const ratio = THREE.MathUtils.clamp(yawOffset / halfRange, -1, 1);
  const tri = (ratio + 1) * 0.5;
  if (tri < 0.5) return tri * 0.5;
  return 1 - tri * 0.5;
}

/**
 * Idle yaw in [-halfRange, halfRange].
 * Triangle ping-pong: same swivel speed both ways, brief turn at rails (no long cosine pause).
 */
export function tickIdleYawOffset(
  state: TowerIdleState,
  halfRange: number
): number {
  if (state.dragging || state.idleEpochMs === null) {
    return clampIdleYaw(state.idleCenterYaw, halfRange);
  }

  const elapsed = (performance.now() - state.idleEpochMs) / 1000;
  const cycle =
    (elapsed / TOWER_IDLE_PENDULUM_PERIOD_S + state.idlePhaseOffset) % 1;
  const tri = triangleWave01(cycle);
  return THREE.MathUtils.lerp(-halfRange, halfRange, tri);
}

export function startIdleClock(
  state: TowerIdleState,
  yawOffset: number,
  halfRange: number
) {
  const center = clampIdleYaw(yawOffset, halfRange);
  state.idleCenterYaw = center;
  state.idlePhaseOffset = cycleOffsetForRelease(center, halfRange);
  state.idleEpochMs = performance.now();
}

export function stopIdleClock(
  state: TowerIdleState,
  yawOffset: number,
  halfRange: number
) {
  state.idleCenterYaw = clampIdleYaw(yawOffset, halfRange);
  state.idleEpochMs = null;
}

/** Sun / lighting — drag offset or pendulum idle offset */
export function getTowerLightingYawOffset(
  state: TowerIdleState,
  halfRange: number
): number {
  return state.dragging
    ? clampIdleYaw(state.yaw, halfRange)
    : tickIdleYawOffset(state, halfRange);
}
