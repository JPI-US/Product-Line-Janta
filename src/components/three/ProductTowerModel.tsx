import { useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import * as THREE from "three";
import type { ProductId } from "../../data/productPages";
import { SCENE, DESIGNER_IDLE_YAW_HALF_RANGE } from "./sceneConfig";
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
import { getCachedTowerScene, getLodPrepKey } from "./towerScenePrep";
import { PRODUCT_SCENES, getProductTowerLayout } from "./productScene";
import { useTowerScenePrepared } from "./useTowerScenePrepared";
import {
  startIdleClock,
  stopIdleClock,
  tickIdleYawOffset,
} from "./towerIdleRotation";
import { isProductHeroLayout } from "../../lib/productHeroScroll";
import {
  clampTowerDragYaw,
  towerDragState,
} from "./towerDragState";
import { isAnyTowerDragging } from "./towerDragSync";
import {
  ensureSharedIdleStarted,
  resetSharedIdle,
  setActiveYawHalfRange,
  towerSharedRotation,
} from "./towerSharedRotation";
import { isProductHero3dActive } from "./productScrollPerf";
import { SCROLL_OFFSET_EPS } from "./utilityCanvasPerf";
import { TowerHoverHighlight } from "./TowerHoverHighlight";

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

  const ready = useTowerScenePrepared(sceneConfig.prepKey);
  const lodReady = useTowerScenePrepared(getLodPrepKey(sceneConfig.prepKey));
  // Progressive swap: render the -lod2 stand-in the moment it's prepared,
  // then re-clone the full-res scene when it lands (same effect below).
  const prepared = ready
    ? getCachedTowerScene(sceneConfig.prepKey)
    : lodReady
      ? getCachedTowerScene(getLodPrepKey(sceneConfig.prepKey))
      : null;
  const yawHalfRange = DESIGNER_IDLE_YAW_HALF_RANGE;

  useLayoutEffect(() => {
    setActiveYawHalfRange(yawHalfRange);
  }, [yawHalfRange]);

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
    const layout = getProductTowerLayout(productId);
    const offsetY = THREE.MathUtils.lerp(
      layout.offsetY,
      layout.offsetYEnd,
      blend
    );
    groupRef.current.position.set(layout.offsetX, baseLift + offsetY, 0);

    const productHero = isProductHeroLayout(productId);
    const splitBaseYaw = getSplitViewBaseYaw(blend, layout.offsetX);
    const infoReveal = getInfoRevealProgress(scrollOffset, productHero);
    const cameraShiftComplete = isIntroAnimationComplete(scrollOffset, productHero);
    const rotateReady = productHero ? cameraShiftComplete : infoReveal >= 0.98;
    const idleCenter = SCENE.tower.idleYawCenter;
    const wasDragging = wasDraggingRef.current;
    wasDraggingRef.current = state.dragging;

    if (!cameraShiftComplete) {
      if (shared.idleEpochMs !== null) resetSharedIdle();
      groupRef.current.rotation.y = getTowerYawTowardSun(
        blend,
        layout.offsetX,
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
        tickIdleYawOffset(shared, yawHalfRange),
        yawHalfRange
      );
    } else if (rotateReady && wasDragging && !state.dragging) {
      startIdleClock(
        shared,
        groupRef.current.rotation.y - splitBaseYaw,
        yawHalfRange
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
        layout.offsetX,
        0
      );
      return;
    }

    groupRef.current.rotation.y = applySplitViewYawOffset(
      splitBaseYaw,
      yawOffset,
      yawHalfRange
    );
  });

  if (!prepared) return null;

  return (
    <>
      <group ref={groupRef} />
      <TowerHoverHighlight targetRef={cloneRef} />
    </>
  );
}
