import { useScroll } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { USE_UNIFIED_TOWER_CANVAS } from "./towerCanvasMode";
import { useTowerCanvasVisibility } from "./towerCanvasVisibility";
import { isAnyTowerDragging } from "./towerDragSync";
import { isProductHero3dActive } from "./productScrollPerf";
import {
  SCROLL_INVALIDATE_MS,
  SCROLL_OFFSET_EPS,
} from "./utilityCanvasPerf";
import { useActiveTowerProduct } from "./useActiveTowerProduct";

/**
 * Keeps demand frameloop in sync with drei ScrollControls damping.
 * Capped at ~30fps during scroll so damping stays smooth without redundant draws.
 */
type ScrollInvalidateProps = {
  /** Single-product page — always sync scroll invalidates to this canvas */
  alwaysActive?: boolean;
};

export function ScrollInvalidate({ alwaysActive = false }: ScrollInvalidateProps) {
  const scroll = useScroll();
  const invalidate = useThree((state) => state.invalidate);
  const { renderDesigner3d } = useTowerCanvasVisibility();
  const activeProduct = useActiveTowerProduct();
  const designerActive =
    alwaysActive ||
    (USE_UNIFIED_TOWER_CANVAS
      ? activeProduct === "designer"
      : renderDesigner3d);
  const lastOffset = useRef(scroll.offset);
  const lastInvalidateMs = useRef(0);

  useFrame(() => {
    if (!designerActive) return;
    const offset = scroll.offset;
    if (alwaysActive && !isProductHero3dActive(offset)) return;
    if (Math.abs(offset - lastOffset.current) <= SCROLL_OFFSET_EPS) return;
    lastOffset.current = offset;

    const now = performance.now();
    if (
      !isAnyTowerDragging() &&
      now - lastInvalidateMs.current < SCROLL_INVALIDATE_MS
    ) {
      return;
    }
    lastInvalidateMs.current = now;
    invalidate();
  });

  return null;
}
