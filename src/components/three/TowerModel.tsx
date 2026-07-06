import { useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useScroll } from "@react-three/drei";
import * as THREE from "three";
import { SCENE } from "./sceneConfig";
import {
  getInfoRevealProgress,
  isIntroAnimationComplete,
} from "./infoReveal";
import {
  applySplitViewYawOffset,
  getScrollBlend,
  getSplitViewBaseYaw,
  getTowerYawTowardSun,
  getTowerVisualYawOffset,
} from "./sceneScroll";
import { getCachedTowerScene, TOWER_PREP_KEYS } from "./towerScenePrep";
import { DESIGNER_MODEL_URL } from "./towerModelUrls";
import { useTowerScenePrepared } from "./useTowerScenePrepared";
import {
  startIdleClock,
  stopIdleClock,
  tickIdleYawOffset,
} from "./towerIdleRotation";
import {
  clampTowerDragYaw,
  TOWER_DRAG_YAW_HALF_RANGE,
  towerDragState,
} from "./towerDragState";
import { isAnyTowerDragging } from "./towerDragSync";
import {
  ensureSharedIdleStarted,
  resetSharedIdle,
  towerSharedRotation,
  TOWER_YAW_HALF_RANGE,
} from "./towerSharedRotation";

export const TOWER_MODEL_URL = DESIGNER_MODEL_URL;

const reducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function TowerModel() {
  const groupRef = useRef<THREE.Group>(null);
  const cloneRef = useRef<THREE.Object3D | null>(null);
  const wasDraggingRef = useRef(false);
  const scroll = useScroll();
  useGLTF(TOWER_MODEL_URL);

  const designerReady = useTowerScenePrepared(TOWER_PREP_KEYS.designer);
  const prepared = designerReady
    ? getCachedTowerScene(TOWER_PREP_KEYS.designer)
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

    const { baseLift } = prepared;

    const state = towerDragState;
    const shared = towerSharedRotation;
    const scrollOffset = scroll.offset;
    const blend = getScrollBlend(scrollOffset);
    const offsetY = THREE.MathUtils.lerp(
      SCENE.tower.offsetY,
      SCENE.tower.offsetYEnd,
      blend
    );
    groupRef.current.position.set(
      SCENE.tower.offsetX,
      baseLift + offsetY,
      0
    );

    const splitBaseYaw = getSplitViewBaseYaw(blend, SCENE.tower.offsetX);
    const infoReveal = getInfoRevealProgress(scrollOffset);
    const introComplete = isIntroAnimationComplete(scrollOffset);
    const splitReady = infoReveal >= 0.98;
    const idleCenter = SCENE.tower.idleYawCenter;
    const wasDragging = wasDraggingRef.current;
    wasDraggingRef.current = state.dragging;

    if (!introComplete) {
      if (shared.idleEpochMs !== null) resetSharedIdle();
      groupRef.current.rotation.y = getTowerYawTowardSun(
        blend,
        SCENE.tower.offsetX,
        0
      );
      return;
    }

    if (splitReady && state.dragging && !wasDragging) {
      shared.yaw = clampTowerDragYaw(
        groupRef.current.rotation.y - splitBaseYaw
      );
      stopIdleClock(
        shared,
        tickIdleYawOffset(shared, TOWER_YAW_HALF_RANGE),
        TOWER_YAW_HALF_RANGE
      );
    } else if (splitReady && wasDragging && !state.dragging) {
      startIdleClock(
        shared,
        groupRef.current.rotation.y - splitBaseYaw,
        TOWER_YAW_HALF_RANGE
      );
    } else if (
      !state.dragging &&
      shared.idleEpochMs === null &&
      !reducedMotion
    ) {
      ensureSharedIdleStarted(reducedMotion);
    }

    const yawOffset = reducedMotion
      ? idleCenter
      : getTowerVisualYawOffset(scrollOffset, isAnyTowerDragging());

    if (!splitReady) {
      groupRef.current.rotation.y = getTowerYawTowardSun(
        blend,
        SCENE.tower.offsetX,
        0
      );
      return;
    }

    groupRef.current.rotation.y = applySplitViewYawOffset(
      splitBaseYaw,
      yawOffset,
      TOWER_DRAG_YAW_HALF_RANGE
    );
  });

  if (!prepared) return null;

  return <group ref={groupRef} />;
}
