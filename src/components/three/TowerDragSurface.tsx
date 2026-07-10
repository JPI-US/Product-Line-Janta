import { useEffect, useRef } from "react";
import type { ProductId } from "../../data/productPages";
import { clampTowerDragYaw, towerDragState } from "./towerDragState";
import { towerSharedRotation } from "./towerSharedRotation";
import { getTowerScrollRoot } from "./towerScrollRoot";
import { isProductHeroLayout } from "../../lib/productHeroScroll";
import { getDesignerClickScrollTarget } from "./infoReveal";
import { SCENE } from "./sceneConfig";

const DRAG_SENSITIVITY = 0.0055;

/** Click-vs-drag guard — a clean tap is short and barely moves */
const CLICK_MAX_MS = 250;
const CLICK_MAX_MOVE_PX = 6;

const CLICK_EASE_MS_PER_VIEWPORT = 340;
const CLICK_EASE_MIN_MS = 700;
const CLICK_EASE_MAX_MS = 1800;
const CLICK_TARGET_EPS = 0.018;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function getNormalizedScrollOffset(scrollRoot: HTMLElement): number {
  const limit = scrollRoot.scrollHeight - scrollRoot.clientHeight;
  if (limit <= 0) return 0;
  return scrollRoot.scrollTop / limit;
}

function getUtilityClickTarget(current: number): number | null {
  const target = SCENE.scroll.introEnd;
  if (current >= target - CLICK_TARGET_EPS) return null;
  return target;
}

type TowerDragSurfaceProps = {
  productId: ProductId;
};

/**
 * Lives on the page shell (not inside drei's transformed scroll DOM) so drag
 * works in the split layout and during the hero animation.
 */
export function TowerDragSurface({ productId }: TowerDragSurfaceProps) {
  const productHero = isProductHeroLayout(productId);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const lastPointerX = useRef(0);
  const downX = useRef(0);
  const downY = useRef(0);
  const downTime = useRef(0);
  const easeRaf = useRef(0);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const experience = surface.closest<HTMLElement>(".tower-3d__experience");

    const easeScrollTo = (targetNorm: number) => {
      const scrollRoot = getTowerScrollRoot();
      if (!scrollRoot) return;
      const limit = scrollRoot.scrollHeight - scrollRoot.clientHeight;
      if (limit <= 0) return;

      const start = scrollRoot.scrollTop;
      const target = Math.min(limit, targetNorm * limit);
      const distance = target - start;
      if (Math.abs(distance) < 1) return;

      if (easeRaf.current) cancelAnimationFrame(easeRaf.current);

      if (prefersReducedMotion()) {
        scrollRoot.scrollTop = target;
        return;
      }

      const viewports = Math.abs(distance) / Math.max(1, scrollRoot.clientHeight);
      const duration = Math.min(
        CLICK_EASE_MAX_MS,
        Math.max(CLICK_EASE_MIN_MS, viewports * CLICK_EASE_MS_PER_VIEWPORT)
      );

      const startTime = performance.now();
      const stepFrame = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration);
        scrollRoot.scrollTop = start + distance * easeInOutQuad(t);
        if (t < 1) {
          easeRaf.current = requestAnimationFrame(stepFrame);
        } else {
          easeRaf.current = 0;
        }
      };
      easeRaf.current = requestAnimationFrame(stepFrame);
    };

    const easeScrollForward = () => {
      const scrollRoot = getTowerScrollRoot();
      if (!scrollRoot) return;
      const current = getNormalizedScrollOffset(scrollRoot);
      const target = productHero
        ? getDesignerClickScrollTarget(current)
        : getUtilityClickTarget(current);
      if (target === null) return;
      easeScrollTo(target);
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

    const onTapDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      downX.current = event.clientX;
      downY.current = event.clientY;
      downTime.current = performance.now();
      if (easeRaf.current) {
        cancelAnimationFrame(easeRaf.current);
        easeRaf.current = 0;
      }
    };

    const onTapUp = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const elapsed = performance.now() - downTime.current;
      const moved = Math.hypot(
        event.clientX - downX.current,
        event.clientY - downY.current
      );
      if (elapsed > CLICK_MAX_MS || moved > CLICK_MAX_MOVE_PX) return;

      const target = event.target as HTMLElement | null;
      if (
        !target ||
        (!target.closest(".tower-3d__viewport") &&
          !target.closest(".tower-3d__drag-surface"))
      ) {
        return;
      }

      if (!productHero && towerDragState.canRotate) return;

      easeScrollForward();
    };

    surface.addEventListener("pointerdown", onPointerDown);
    surface.addEventListener("pointermove", onPointerMove);
    surface.addEventListener("pointerup", onPointerUp);
    surface.addEventListener("pointercancel", onPointerUp);
    surface.addEventListener("lostpointercapture", stopDrag);
    surface.addEventListener("wheel", onWheel, { passive: false });

    if (experience) {
      experience.addEventListener("pointerdown", onTapDown);
      experience.addEventListener("pointerup", onTapUp);
    }

    return () => {
      surface.removeEventListener("pointerdown", onPointerDown);
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerup", onPointerUp);
      surface.removeEventListener("pointercancel", onPointerUp);
      surface.removeEventListener("lostpointercapture", stopDrag);
      surface.removeEventListener("wheel", onWheel);
      if (experience) {
        experience.removeEventListener("pointerdown", onTapDown);
        experience.removeEventListener("pointerup", onTapUp);
      }
      if (easeRaf.current) cancelAnimationFrame(easeRaf.current);
      setDraggingUi(false);
    };
  }, [productHero]);

  return (
    <div
      ref={surfaceRef}
      className="tower-3d__drag-surface"
      aria-hidden
    />
  );
}
