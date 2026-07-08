import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { isAnyTowerDragging } from "./towerDragSync";
import { towerSharedRotation } from "./towerSharedRotation";
import { resetYawFrameSample } from "./towerFrameClock";
import { TOWER_IDLE_INVALIDATE_MS } from "./utilityCanvasPerf";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Single-canvas idle loop — one invalidate drives both products */
export function TowerUnifiedIdleDriver() {
  const invalidate = useThree((state) => state.invalidate);
  const lastInvalidateMs = useRef(0);

  useEffect(() => {
    let frame = 0;

    const loop = (now: number) => {
      const idleActive =
        !reducedMotion() && towerSharedRotation.idleEpochMs !== null;
      const dragging = isAnyTowerDragging();

      if (idleActive || dragging) {
        resetYawFrameSample();
        const minDelta = dragging ? 0 : TOWER_IDLE_INVALIDATE_MS;
        if (now - lastInvalidateMs.current >= minDelta) {
          invalidate();
          lastInvalidateMs.current = now;
        }
        frame = requestAnimationFrame(loop);
      } else {
        frame = 0;
      }
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [invalidate]);

  return null;
}
