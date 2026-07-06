import { useEffect, useRef } from "react";
import {
  clampWebsiteCameraPitch,
  syncWebsiteDragFromRenderedYaw,
  websiteTowerOrbit,
} from "./websiteTowerOrbit";
import { getWebsiteDrivenScrollOffset } from "./websiteScrollDriver";
import { getWebsiteHeroTrackingYaw } from "./websiteHeroScroll";
import {
  getWebsiteOrbitBlend,
  WEBSITE_PAGE_LIFT_START,
} from "./websiteScrollConfig";
import { getWebsiteScrollRoot } from "./websiteScrollRoot";

const DRAG_YAW_SENS = 0.0058;
const DRAG_PITCH_SENS = 0.0048;
const HERO_OFFSET_EPS = 0.004;
const HUB_CANVAS_INVALIDATE = "hub-tower-invalidate";

function requestHubCanvasInvalidate() {
  window.dispatchEvent(new Event(HUB_CANVAS_INVALIDATE));
}

function syncCanOrbit() {
  const ready =
    getWebsiteDrivenScrollOffset() < WEBSITE_PAGE_LIFT_START - HERO_OFFSET_EPS;
  websiteTowerOrbit.canOrbit = ready;
  document.documentElement.classList.toggle("web-hero-orbit-ready", ready);
}

/** Horizontal + vertical drag orbit over the hero canvas */
export function WebsiteTowerDragSurface() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const lastPointerX = useRef(0);
  const lastPointerY = useRef(0);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const setDraggingUi = (active: boolean) => {
      websiteTowerOrbit.dragging = active;
      document.documentElement.classList.toggle("web-hero-dragging", active);
      const scrollRoot = getWebsiteScrollRoot();
      if (scrollRoot) {
        scrollRoot.style.overflowY = active ? "hidden" : "auto";
      }
    };

    const stopDrag = () => {
      if (!websiteTowerOrbit.dragging) return;
      setDraggingUi(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      syncCanOrbit();
      if (!websiteTowerOrbit.canOrbit) return;

      const offset = getWebsiteDrivenScrollOffset();
      const cycleBlend = getWebsiteOrbitBlend(offset);
      syncWebsiteDragFromRenderedYaw(getWebsiteHeroTrackingYaw(cycleBlend));

      websiteTowerOrbit.dragging = true;
      lastPointerX.current = event.clientX;
      lastPointerY.current = event.clientY;
      setDraggingUi(true);
      surface.setPointerCapture(event.pointerId);
      requestHubCanvasInvalidate();
      event.preventDefault();
      event.stopPropagation();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!websiteTowerOrbit.dragging) return;
      const deltaX = event.clientX - lastPointerX.current;
      const deltaY = event.clientY - lastPointerY.current;
      lastPointerX.current = event.clientX;
      lastPointerY.current = event.clientY;

      websiteTowerOrbit.yawOffset =
        websiteTowerOrbit.yawOffset - deltaX * DRAG_YAW_SENS;
      websiteTowerOrbit.pitchOffset = clampWebsiteCameraPitch(
        websiteTowerOrbit.pitchOffset + deltaY * DRAG_PITCH_SENS
      );
      requestHubCanvasInvalidate();
      event.preventDefault();
      event.stopPropagation();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!websiteTowerOrbit.dragging) return;
      if (surface.hasPointerCapture(event.pointerId)) {
        surface.releasePointerCapture(event.pointerId);
      }
      stopDrag();
      requestHubCanvasInvalidate();
      event.preventDefault();
      event.stopPropagation();
    };

    syncCanOrbit();
    window.addEventListener("resize", syncCanOrbit, { passive: true });

    surface.addEventListener("pointerdown", onPointerDown);
    surface.addEventListener("pointermove", onPointerMove);
    surface.addEventListener("pointerup", onPointerUp);
    surface.addEventListener("pointercancel", onPointerUp);
    surface.addEventListener("lostpointercapture", stopDrag);

    return () => {
      window.removeEventListener("resize", syncCanOrbit);
      surface.removeEventListener("pointerdown", onPointerDown);
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerup", onPointerUp);
      surface.removeEventListener("pointercancel", onPointerUp);
      surface.removeEventListener("lostpointercapture", stopDrag);
      setDraggingUi(false);
    };
  }, []);

  return <div ref={surfaceRef} className="web__drag-surface" aria-hidden />;
}
