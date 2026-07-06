import { useScroll } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { getWebsiteHeroCanvasActive } from "./websiteHeroCanvasGate";
import { subscribeWebsiteHeroScroll } from "./websiteHeroScrollBus";
import { getWebsiteScrollOffset } from "./websiteScrollOffset";
import { websiteTowerOrbit } from "./websiteTowerOrbit";

const OFFSET_EPS = 0.004;
const MIN_MS = 180;
const DRAG_MIN_MS = 72;
const HUB_CANVAS_INVALIDATE = "hub-tower-invalidate";

/** Keep demand frameloop in sync with hero drag + authoritative scroll offset */
export function WebsiteScrollInvalidate() {
  const scroll = useScroll();
  const invalidate = useThree((s) => s.invalidate);
  const lastOffset = useRef(getWebsiteScrollOffset(scroll));
  const lastMs = useRef(0);
  const lastDragMs = useRef(0);

  useEffect(() => {
    const onInvalidate = () => {
      if (!websiteTowerOrbit.dragging) return;
      const now = performance.now();
      if (now - lastDragMs.current < DRAG_MIN_MS) return;
      lastDragMs.current = now;
      invalidate();
    };

    window.addEventListener(HUB_CANVAS_INVALIDATE, onInvalidate);

    const onHeroScroll = () => {
      if (websiteTowerOrbit.dragging) return;
      if (!getWebsiteHeroCanvasActive()) return;

      const offset = getWebsiteScrollOffset(scroll);
      if (Math.abs(offset - lastOffset.current) <= OFFSET_EPS) return;
      lastOffset.current = offset;

      const now = performance.now();
      if (now - lastMs.current < MIN_MS) return;
      lastMs.current = now;
      invalidate();
    };

    const unsubscribe = subscribeWebsiteHeroScroll(onHeroScroll);

    return () => {
      unsubscribe();
      window.removeEventListener(HUB_CANVAS_INVALIDATE, onInvalidate);
    };
  }, [invalidate, scroll]);

  return null;
}
