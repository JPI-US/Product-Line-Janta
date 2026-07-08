import { useEffect, useRef } from "react";
import { clampTowerDragYaw, towerDragState } from "./towerDragState";
import { towerSharedRotation } from "./towerSharedRotation";
import { getTowerScrollRoot } from "./towerScrollRoot";

const DRAG_SENSITIVITY = 0.0055;

/**
 * Lives on the page shell (not inside drei's transformed scroll DOM) so drag
 * works in the split layout and during the hero animation.
 */
export function TowerDragSurface() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const lastPointerX = useRef(0);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const setDraggingUi = (active: boolean) => {
      towerDragState.dragging = active;
      document.documentElement.classList.toggle("tower-3d-dragging", active);
      const scrollRoot = getTowerScrollRoot();
      if (scrollRoot) {
        scrollRoot.style.overflowY = active ? "hidden" : "auto";
      }
    };

    const stopDrag = () => {
      if (!towerDragState.dragging) return;
      setDraggingUi(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (!towerDragState.canRotate) return;
      if (event.target !== surface && !surface.contains(event.target as Node)) {
        return;
      }

      towerDragState.dragging = true;
      lastPointerX.current = event.clientX;
      setDraggingUi(true);
      surface.setPointerCapture(event.pointerId);
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!towerDragState.dragging) return;
      const deltaX = event.clientX - lastPointerX.current;
      lastPointerX.current = event.clientX;
      towerSharedRotation.yaw = clampTowerDragYaw(
        towerSharedRotation.yaw - deltaX * DRAG_SENSITIVITY
      );
      event.preventDefault();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!towerDragState.dragging) return;
      if (surface.hasPointerCapture(event.pointerId)) {
        surface.releasePointerCapture(event.pointerId);
      }
      stopDrag();
      event.preventDefault();
    };

    const onWheel = (event: WheelEvent) => {
      if (towerDragState.dragging) return;
      const scrollRoot = getTowerScrollRoot();
      if (!scrollRoot) return;
      scrollRoot.scrollTop += event.deltaY;
      event.preventDefault();
    };

    surface.addEventListener("pointerdown", onPointerDown);
    surface.addEventListener("pointermove", onPointerMove);
    surface.addEventListener("pointerup", onPointerUp);
    surface.addEventListener("pointercancel", onPointerUp);
    surface.addEventListener("lostpointercapture", stopDrag);
    surface.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      surface.removeEventListener("pointerdown", onPointerDown);
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerup", onPointerUp);
      surface.removeEventListener("pointercancel", onPointerUp);
      surface.removeEventListener("lostpointercapture", stopDrag);
      surface.removeEventListener("wheel", onWheel);
      setDraggingUi(false);
    };
  }, []);

  return (
    <div
      ref={surfaceRef}
      className="tower-3d__drag-surface"
      aria-hidden
    />
  );
}
