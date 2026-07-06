import { useEffect, useRef } from "react";
import { getWebsiteScrollRoot, subscribeWebsiteScrollRoot } from "./websiteScrollRoot";
import { websiteTowerOrbit } from "./websiteTowerOrbit";

/** Forward wheel + touch to the drei scroll root (single scroll driver). */
export function WebsitePageScroll() {
  const lastTouchY = useRef<number | null>(null);
  const scrollRootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".web-page");
    if (!page) return;

    const applyDelta = (deltaY: number) => {
      const scrollRoot = scrollRootRef.current ?? getWebsiteScrollRoot();
      if (!scrollRoot) return;
      scrollRoot.scrollTop += deltaY;
    };

    const onWheel = (event: Event) => {
      if (!(event instanceof WheelEvent)) return;
      if (websiteTowerOrbit.dragging) return;

      applyDelta(event.deltaY);
      event.preventDefault();
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        lastTouchY.current = null;
        return;
      }
      lastTouchY.current = event.touches[0].clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (websiteTowerOrbit.dragging) return;
      if (event.touches.length !== 1 || lastTouchY.current == null) return;

      const y = event.touches[0].clientY;
      const delta = lastTouchY.current - y;
      lastTouchY.current = y;

      if (delta !== 0) {
        applyDelta(delta);
        event.preventDefault();
      }
    };

    const onTouchEnd = () => {
      lastTouchY.current = null;
    };

    page.addEventListener("wheel", onWheel, { passive: false });
    page.addEventListener("touchstart", onTouchStart, { passive: true });
    page.addEventListener("touchmove", onTouchMove, { passive: false });
    page.addEventListener("touchend", onTouchEnd, { passive: true });
    page.addEventListener("touchcancel", onTouchEnd, { passive: true });

    const attachScrollRoot = (root: HTMLElement | null) => {
      scrollRootRef.current = root;
    };
    const unsubscribeRoot = subscribeWebsiteScrollRoot(attachScrollRoot);

    return () => {
      unsubscribeRoot();
      page.removeEventListener("wheel", onWheel);
      page.removeEventListener("touchstart", onTouchStart);
      page.removeEventListener("touchmove", onTouchMove);
      page.removeEventListener("touchend", onTouchEnd);
      page.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return null;
}
