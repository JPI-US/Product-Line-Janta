import { useEffect, useRef } from "react";
import {
  clampUtilityDragYaw,
  utilityTowerDragState,
} from "./utilityTowerDragState";
import { towerSharedRotation } from "./towerSharedRotation";
import { getTowerScrollRoot } from "./towerScrollRoot";

const DRAG_SENSITIVITY = 0.0055;

export function UtilityDragSurface() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const lastPointerX = useRef(0);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const setDraggingUi = (active: boolean) => {
      utilityTowerDragState.dragging = active;
      document.documentElement.classList.toggle(
        "tower-3d-utility-dragging",
        active
      );
      const scrollRoot = getTowerScrollRoot();
      if (scrollRoot) {
        scrollRoot.style.overflowY = active ? "hidden" : "auto";
      }
    };

    const stopDrag = () => {
      if (!utilityTowerDragState.dragging) return;
      setDraggingUi(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (!utilityTowerDragState.canRotate) return;
      if (event.target !== surface && !surface.contains(event.target as Node)) {
        return;
      }

      utilityTowerDragState.dragging = true;
      lastPointerX.current = event.clientX;
      setDraggingUi(true);
      surface.setPointerCapture(event.pointerId);
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!utilityTowerDragState.dragging) return;
      const deltaX = event.clientX - lastPointerX.current;
      lastPointerX.current = event.clientX;
      towerSharedRotation.yaw = clampUtilityDragYaw(
        towerSharedRotation.yaw - deltaX * DRAG_SENSITIVITY
      );
      event.preventDefault();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!utilityTowerDragState.dragging) return;
      if (surface.hasPointerCapture(event.pointerId)) {
        surface.releasePointerCapture(event.pointerId);
      }
      stopDrag();
      event.preventDefault();
    };

    const onWheel = (event: WheelEvent) => {
      if (utilityTowerDragState.dragging) return;
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
      utilityTowerDragState.canRotate = false;
    };
  }, []);

  useEffect(() => {
    const surface = surfaceRef.current;
    const section = surface?.closest(".tower-3d__utility-section");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible =
          entry.isIntersecting && entry.intersectionRatio >= 0.35;
        utilityTowerDragState.canRotate = visible;
        document.documentElement.classList.toggle(
          "tower-3d-utility-rotate-ready",
          visible
        );
      },
      { threshold: [0, 0.35, 0.6] }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      utilityTowerDragState.canRotate = false;
      document.documentElement.classList.remove("tower-3d-utility-rotate-ready");
    };
  }, []);

  return (
    <div
      ref={surfaceRef}
      className="tower-3d__utility-drag-surface"
      aria-hidden
    />
  );
}
