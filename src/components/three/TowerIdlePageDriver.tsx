import { useEffect, useRef } from "react";
import { useTowerCanvasVisibility } from "./towerCanvasVisibility";
import { invalidateTowerCanvas } from "./towerCanvasInvalidate";
import { isAnyTowerDragging } from "./towerDragSync";
import {
  subscribeTowerIdleWake,
  towerSharedRotation,
} from "./towerSharedRotation";
import { resetYawFrameSample } from "./towerFrameClock";
import { isProductHero3dActive } from "./productScrollPerf";
import { towerScrollOffset } from "./towerScrollOffset";
import { TOWER_IDLE_INVALIDATE_MS } from "./utilityCanvasPerf";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Drives shared idle invalidates for the visible tower canvas only.
 * No rAF while off-screen; wakes when idle pendulum starts.
 */
type TowerIdlePageDriverProps = {
  /** Dedicated product route — one canvas, always on screen */
  singleCanvas?: boolean;
};

export function TowerIdlePageDriver({
  singleCanvas = false,
}: TowerIdlePageDriverProps) {
  const visibility = useTowerCanvasVisibility();
  const renderDesigner3d = singleCanvas || visibility.renderDesigner3d;
  const renderUtility3d = singleCanvas ? false : visibility.renderUtility3d;
  const lastInvalidateMs = useRef(0);
  const renderDesignerRef = useRef(renderDesigner3d);
  const renderUtilityRef = useRef(renderUtility3d);
  renderDesignerRef.current = renderDesigner3d;
  renderUtilityRef.current = renderUtility3d;

  useEffect(() => {
    let frame = 0;

    const loop = (now: number) => {
      const designer = renderDesignerRef.current;
      const utility = renderUtilityRef.current;
      if (singleCanvas && !isProductHero3dActive(towerScrollOffset)) {
        frame = 0;
        return;
      }
      if (!designer && !utility) {
        frame = 0;
        return;
      }

      const idleActive =
        !reducedMotion() && towerSharedRotation.idleEpochMs !== null;
      const dragging = isAnyTowerDragging();

      if (idleActive || dragging) {
        resetYawFrameSample();
        const minDelta = dragging ? 0 : TOWER_IDLE_INVALIDATE_MS;
        if (now - lastInvalidateMs.current >= minDelta) {
          if (utility) {
            invalidateTowerCanvas("utility");
          } else if (designer) {
            invalidateTowerCanvas("designer");
          }
          lastInvalidateMs.current = now;
        }
        frame = requestAnimationFrame(loop);
      } else {
        frame = 0;
      }
    };

    const kick = () => {
      if (frame) return;
      if (!renderDesignerRef.current && !renderUtilityRef.current) return;
      frame = requestAnimationFrame(loop);
    };

    const unsubIdle = subscribeTowerIdleWake(kick);

    if (renderDesigner3d || renderUtility3d) {
      kick();
    }

    return () => {
      unsubIdle();
      cancelAnimationFrame(frame);
    };
  }, [renderDesigner3d, renderUtility3d]);

  return null;
}
