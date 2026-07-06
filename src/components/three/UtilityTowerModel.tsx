import { useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import {
  getSplitViewBaseYaw,
  SUN_TRACK_BLEND_END,
} from "./sceneScroll";
import { getCachedTowerScene, TOWER_PREP_KEYS } from "./towerScenePrep";
import { useTowerScenePrepared } from "./useTowerScenePrepared";
import { startIdleClock, stopIdleClock, tickIdleYawOffset } from "./towerIdleRotation";
import { UTILITY_SCENE } from "./utilitySceneConfig";
import {
  clampUtilityDragYaw,
  UTILITY_DRAG_YAW_HALF_RANGE,
  utilityTowerDragState,
} from "./utilityTowerDragState";
import { isAnyTowerDragging } from "./towerDragSync";
import {
  towerSharedRotation,
  TOWER_YAW_HALF_RANGE,
} from "./towerSharedRotation";
import { applySharedTowerYaw } from "./towerRotationApply";
import { invalidateTowerCanvas } from "./towerCanvasInvalidate";
import { resetYawFrameSample } from "./towerFrameClock";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function UtilityTowerModel() {
  const groupRef = useRef<THREE.Group>(null);
  const cloneRef = useRef<THREE.Object3D | null>(null);
  const wasDraggingRef = useRef(false);
  const wasSectionActiveRef = useRef(false);
  const utilityReady = useTowerScenePrepared(TOWER_PREP_KEYS.utility);

  const prepared = utilityReady
    ? getCachedTowerScene(TOWER_PREP_KEYS.utility)
    : null;

  useLayoutEffect(() => {
    if (!prepared || !groupRef.current) return;
    const group = groupRef.current;
    if (cloneRef.current) {
      group.remove(cloneRef.current);
      cloneRef.current = null;
    }
    const clone = prepared.root.clone(true);
    cloneRef.current = clone;
    group.add(clone);
  }, [prepared]);

  useFrame(() => {
    if (!prepared || !groupRef.current) return;

    const sectionActive = utilityTowerDragState.canRotate;
    if (
      !sectionActive &&
      !utilityTowerDragState.dragging &&
      towerSharedRotation.idleEpochMs === null
    ) {
      return;
    }
    if (sectionActive && !wasSectionActiveRef.current) {
      resetYawFrameSample();
      invalidateTowerCanvas("utility");
    }
    wasSectionActiveRef.current = sectionActive;

    const { baseLift } = prepared;
    const state = utilityTowerDragState;
    const shared = towerSharedRotation;
    const { offsetX, offsetY, yawOffset } = UTILITY_SCENE.tower;
    groupRef.current.position.set(offsetX, baseLift + offsetY, 0);

    const splitBaseYaw = getSplitViewBaseYaw(
      SUN_TRACK_BLEND_END,
      offsetX,
      yawOffset
    );
    const wasDragging = wasDraggingRef.current;
    wasDraggingRef.current = state.dragging;
    const dragging = isAnyTowerDragging();

    if (state.dragging) {
      if (!wasDragging) {
        shared.yaw = clampUtilityDragYaw(
          groupRef.current.rotation.y - splitBaseYaw
        );
        stopIdleClock(
          shared,
          tickIdleYawOffset(shared, TOWER_YAW_HALF_RANGE),
          TOWER_YAW_HALF_RANGE
        );
      }

      applySharedTowerYaw(
        groupRef.current,
        splitBaseYaw,
        UTILITY_DRAG_YAW_HALF_RANGE,
        true,
        reducedMotion()
      );
      return;
    }

    if (wasDragging) {
      startIdleClock(
        shared,
        groupRef.current.rotation.y - splitBaseYaw,
        TOWER_YAW_HALF_RANGE
      );
    }

    applySharedTowerYaw(
      groupRef.current,
      splitBaseYaw,
      UTILITY_DRAG_YAW_HALF_RANGE,
      dragging,
      reducedMotion()
    );
  });

  if (!prepared) return null;

  return <group ref={groupRef} />;
}
