import * as THREE from "three";
import { applySplitViewYawOffset } from "./sceneScroll";
import { sampleSharedYawThisFrame } from "./towerFrameClock";
import { towerSharedRotation } from "./towerSharedRotation";

export function applySharedTowerYaw(
  group: THREE.Object3D,
  splitBaseYaw: number,
  halfRange: number,
  isDragging: boolean,
  reducedMotion: boolean
) {
  const yaw = reducedMotion
    ? towerSharedRotation.idleCenterYaw
    : sampleSharedYawThisFrame(isDragging);
  group.rotation.y = applySplitViewYawOffset(splitBaseYaw, yaw, halfRange);
}
