import { useEffect, useRef } from "react";
import { clampTowerDragYaw, towerDragState } from "./towerDragState";
import { towerSharedRotation } from "./towerSharedRotation";
import { getTowerScrollRoot } from "./towerScrollRoot";

const DRAG_SENSITIVITY = 0.0055;

/** Click-vs-drag guard — a clean tap is short and barely moves */
const CLICK_MAX_MS = 250;
const CLICK_MAX_MOVE_PX = 6;
const CLICK_EASE_MS = 620;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Lives on the page shell (not inside drei's transformed scroll DOM) so drag
 * works in the split layout and during the hero animation.
 */
export function TowerDragSurface() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const lastPointerX = useRef(0);
  const downX = useRef(0);
  const downY = useRef(0);
  const downTime = useRef(0);
  const easeRaf = useRef(0);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const easeScrollForward = () => {
      const scrollRoot = getTowerScrollRoot();
      if (!scrollRoot) return;
      const limit = scrollRoot.scrollHeight - scrollRoot.clientHeight;
      if (limit <= 0) return;

      const start = scrollRoot.scrollTop;
      // One panel forward ≈ one viewport, like a natural scroll step
      const target = Math.min(limit, start + scrollRoot.clientHeight);
      if (target - start < 1) return;

      if (easeRaf.current) cancelAnimationFrame(easeRaf.current);

      if (prefersReducedMotion()) {
        scrollRoot.scrollTop = target;
        return;
      }

      const startTime = performance.now();
      const stepFrame = (now: number) => {
        const t = Math.min(1, (now - startTime) / CLICK_EASE_MS);
        scrollRoot.scrollTop = start + (target - start) * easeInOutQuad(t);
        if (t < 1) {
          easeRaf.current = requestAnimationFrame(stepFrame);
        } else {
          easeRaf.current = 0;
        }
      };
      easeRaf.current = requestAnimationFrame(stepFrame);
    };

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

      downX.current = event.clientX;
      downY.current = event.clientY;
      downTime.current = performance.now();
      if (easeRaf.current) {
        cancelAnimationFrame(easeRaf.current);
        easeRaf.current = 0;
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

      const elapsed = performance.now() - downTime.current;
      const moved = Math.hypot(
        event.clientX - downX.current,
        event.clientY - downY.current,
      );
      // A clean tap (not a drag) scrolls forward one panel
      if (elapsed <= CLICK_MAX_MS && moved <= CLICK_MAX_MOVE_PX) {
        easeScrollForward();
      }
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
      if (easeRaf.current) cancelAnimationFrame(easeRaf.current);
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
