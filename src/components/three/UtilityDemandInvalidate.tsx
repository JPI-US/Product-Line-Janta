import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { USE_UNIFIED_TOWER_CANVAS } from "./towerCanvasMode";
import { useTowerCanvasVisibility } from "./towerCanvasVisibility";
import { isAnyTowerDragging } from "./towerDragSync";
import { useActiveTowerProduct } from "./useActiveTowerProduct";

/** Invalidates utility canvas only while dragging (idle is page-driven) */
export function UtilityDemandInvalidate() {
  const invalidate = useThree((state) => state.invalidate);
  const { renderUtility3d } = useTowerCanvasVisibility();
  const utilityActive = useActiveTowerProduct() === "utility";
  const active = USE_UNIFIED_TOWER_CANVAS ? utilityActive : renderUtility3d;

  useEffect(() => {
    if (!active) return;

    let frame = 0;

    const pump = () => {
      if (!isAnyTowerDragging()) {
        frame = 0;
        return;
      }
      invalidate();
      frame = requestAnimationFrame(pump);
    };

    const wake = () => {
      if (frame || !isAnyTowerDragging()) return;
      frame = requestAnimationFrame(pump);
    };

    window.addEventListener("pointermove", wake, { passive: true });
    window.addEventListener("pointerdown", wake, { passive: true });
    window.addEventListener("pointerup", wake, { passive: true });
    window.addEventListener("pointercancel", wake, { passive: true });

    return () => {
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("pointerup", wake);
      window.removeEventListener("pointercancel", wake);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [active, invalidate]);

  return null;
}
