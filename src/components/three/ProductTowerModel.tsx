import { useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useScroll } from "@react-three/drei";
import * as THREE from "three";
import type { ProductId } from "../../data/productPages";
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
import { getCachedTowerScene } from "./towerScenePrep";
import { PRODUCT_SCENES } from "./productScene";
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
import { isProductHero3dActive } from "./productScrollPerf";
import { SCROLL_OFFSET_EPS } from "./utilityCanvasPerf";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Scroll intro + split-view idle/drag — designer and utility share the same motion */
export function ProductTowerModel({ productId }: { productId: ProductId }) {
  const groupRef = useRef<THREE.Group>(null);
  const cloneRef = useRef<THREE.Object3D | null>(null);
  const wasDraggingRef = useRef(false);
  const lastScrollOffset = useRef(-1);
  const scroll = useScroll();
  const sceneConfig = PRODUCT_SCENES[productId];
  useGLTF(sceneConfig.modelUrl);

  const ready = useTowerScenePrepared(sceneConfig.prepKey);
  const prepared = ready ? getCachedTowerScene(sceneConfig.prepKey) : null;

  useLayoutEffect(() => {
    if (!prepared || !groupRef.current) return;
    const group = groupRef.current;
    if (cloneRef.current) {
      group.remove(cloneRef.current);
      cloneRef.current = null;
    }
    const clone = prepared.root.clone(true);
    if (sceneConfig.castShadow) {
      clone.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
    }
    cloneRef.current = clone;
    group.add(clone);
  }, [prepared, sceneConfig.castShadow]);

  useFrame(() => {
    if (!prepared || !groupRef.current) return;

    const scrollOffset = scroll.offset;
    if (!isProductHero3dActive(scrollOffset)) return;
    const dragging = towerDragState.dragging;
    if (
      !dragging &&
      Math.abs(scrollOffset - lastScrollOffset.current) < SCROLL_OFFSET_EPS &&
      towerSharedRotation.idleEpochMs === null
    ) {
      return;
    }
    lastScrollOffset.current = scrollOffset;

    const { baseLift } = prepared;
    const state = towerDragState;
    const shared = towerSharedRotation;
    const blend = getScrollBlend(scrollOffset);
    const offsetY = THREE.MathUtils.lerp(
      SCENE.tower.offsetY,
      SCENE.tower.offsetYEnd,
      blend
    );
    groupRef.current.position.set(SCENE.tower.offsetX, baseLift + offsetY, 0);

    const splitBaseYaw = getSplitViewBaseYaw(blend, SCENE.tower.offsetX);
    const infoReveal = getInfoRevealProgress(scrollOffset);
    const cameraShiftComplete = isIntroAnimationComplete(scrollOffset);
    const isDesigner = productId === "designer";
    // Designer: idle rotation starts as soon as the camera intro shift finishes.
    // Utility: wait until the split-view / card-compose has fully opened.
    const rotateReady = isDesigner ? cameraShiftComplete : infoReveal >= 0.98;
    const idleCenter = SCENE.tower.idleYawCenter;
    const wasDragging = wasDraggingRef.current;
    wasDraggingRef.current = state.dragging;

    if (!cameraShiftComplete) {
      if (shared.idleEpochMs !== null) resetSharedIdle();
      groupRef.current.rotation.y = getTowerYawTowardSun(
        blend,
        SCENE.tower.offsetX,
        0
      );
      return;
    }

    if (rotateReady && state.dragging && !wasDragging) {
      shared.yaw = clampTowerDragYaw(
        groupRef.current.rotation.y - splitBaseYaw
      );
      stopIdleClock(
        shared,
        tickIdleYawOffset(shared, TOWER_YAW_HALF_RANGE),
        TOWER_YAW_HALF_RANGE
      );
    } else if (rotateReady && wasDragging && !state.dragging) {
      startIdleClock(
        shared,
        groupRef.current.rotation.y - splitBaseYaw,
        TOWER_YAW_HALF_RANGE
      );
    } else if (
      !state.dragging &&
      shared.idleEpochMs === null &&
      !reducedMotion()
    ) {
      ensureSharedIdleStarted(reducedMotion());
    }

    const yawOffset = reducedMotion()
      ? idleCenter
      : getTowerVisualYawOffset(scrollOffset, isAnyTowerDragging());

    if (!rotateReady) {
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
