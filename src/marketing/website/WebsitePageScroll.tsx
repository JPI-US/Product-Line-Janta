import { useEffect, useRef } from "react";
import { getWebsiteScrollRoot, subscribeWebsiteScrollRoot } from "./websiteScrollRoot";
import {
  applyWebsiteWheelDelta,
  startWebsiteSmoothScroll,
  stopWebsiteSmoothScroll,
} from "./websiteScrollDriver";
import { scrollWebsiteToAnchor } from "./websiteAnchorScroll";
import { websiteTowerOrbit } from "./websiteTowerOrbit";

/** Forward wheel + touch to the drei scroll root (single scroll driver). */
export function WebsitePageScroll() {
  const lastTouchY = useRef<number | null>(null);
  const scrollRootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".web-page");
    if (!page) return;

    // Touch stays a direct 1:1 write for native feel; wheel is RAF-eased.
    const applyTouchDelta = (deltaY: number) => {
      const scrollRoot = scrollRootRef.current ?? getWebsiteScrollRoot();
      if (!scrollRoot) return;
      scrollRoot.scrollTop += deltaY;
    };

    const onWheel = (event: Event) => {
      if (!(event instanceof WheelEvent)) return;
      if (websiteTowerOrbit.dragging) return;

      // Direct wheel scroll — 1:1 with input (no eased lag).
      applyWebsiteWheelDelta(event.deltaY);
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
        applyTouchDelta(delta);
        event.preventDefault();
      }
    };

    const onTouchEnd = () => {
      lastTouchY.current = null;
    };

    // In-page hash anchors (e.g. #web-cta-band) can't rely on native anchor
    // scrolling inside the transformed virtual-scroll track — ease to them.
    const onAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]',
      );
      if (!anchor) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;
      if (scrollWebsiteToAnchor(hash)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    page.addEventListener("click", onAnchorClick, true);
    page.addEventListener("wheel", onWheel, { passive: false });
    page.addEventListener("touchstart", onTouchStart, { passive: true });
    page.addEventListener("touchmove", onTouchMove, { passive: false });
    page.addEventListener("touchend", onTouchEnd, { passive: true });
    page.addEventListener("touchcancel", onTouchEnd, { passive: true });

    const attachScrollRoot = (root: HTMLElement | null) => {
      scrollRootRef.current = root;
      // Bridge resets the driver then registers the root; starting here ensures
      // the smooth loop runs after that reset (mount order independent).
      if (root) startWebsiteSmoothScroll();
    };
    const unsubscribeRoot = subscribeWebsiteScrollRoot(attachScrollRoot);

    return () => {
      unsubscribeRoot();
      stopWebsiteSmoothScroll();
      page.removeEventListener("click", onAnchorClick, true);
      page.removeEventListener("wheel", onWheel);
      page.removeEventListener("touchstart", onTouchStart);
      page.removeEventListener("touchmove", onTouchMove);
      page.removeEventListener("touchend", onTouchEnd);
      page.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return null;
}
