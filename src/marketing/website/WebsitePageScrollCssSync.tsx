import { useEffect, useRef } from "react";
import {
  applyWebsiteBelowScrollRange,
  markWebsiteBelowScrollInProgress,
  scheduleWebsiteBelowScrollRangeSync,
} from "./websiteBelowScrollMeasure";
import { applyWebsiteScrollStats } from "./websiteScrollCss";
import { getWebsiteScrollVarState } from "./websiteScrollCssState";
import { syncWebsiteStoredScrollFromDom } from "./websiteScrollDriver";
import { emitWebsiteHeroScroll } from "./websiteHeroScrollBus";
import { getWebsiteHeroCanvasActive, syncWebsiteHeroCanvasGate } from "./websiteHeroCanvasGate";
import { syncWebsiteDreiScroll } from "./websiteDreiScrollSync";
import { markWebsiteScrollCompositing, resetWebsiteScrollCompositing } from "./websiteScrollCompositor";
import { websiteTowerOrbit } from "./websiteTowerOrbit";

/** Page-level scroll → CSS vars (immediate wheel position). */
export function WebsitePageScrollCssSync() {
  const scrollRaf = useRef(0);
  const tailRaf = useRef(0);
  const scrollingUntil = useRef(0);

  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".web-page");
    if (!page) return;

    applyWebsiteScrollStats(0, page, getWebsiteScrollVarState());
    applyWebsiteBelowScrollRange(page);

    const syncOffset = (_el: HTMLElement) => {
      markWebsiteBelowScrollInProgress(page);
      markWebsiteScrollCompositing();
      const offset = syncWebsiteStoredScrollFromDom();
      syncWebsiteHeroCanvasGate(offset);
      const heroActive = getWebsiteHeroCanvasActive() || websiteTowerOrbit.dragging;
      applyWebsiteScrollStats(offset, page, getWebsiteScrollVarState(), !heroActive);
      if (heroActive) {
        syncWebsiteDreiScroll(_el);
        emitWebsiteHeroScroll(offset, _el);
      }
    };

    const runTail = () => {
      if (performance.now() >= scrollingUntil.current) {
        tailRaf.current = 0;
        return;
      }
      const el = page.querySelector<HTMLElement>(".web__scroll-root");
      if (el) syncOffset(el);
      tailRaf.current = requestAnimationFrame(runTail);
    };

    const scheduleSync = (el: HTMLElement) => {
      scrollingUntil.current = performance.now() + 120;
      if (!tailRaf.current) tailRaf.current = requestAnimationFrame(runTail);
      if (scrollRaf.current) return;
      scrollRaf.current = requestAnimationFrame(() => {
        scrollRaf.current = 0;
        syncOffset(el);
      });
    };

    let detach: (() => void) | null = null;

    const attach = (el: HTMLElement) => {
      detach?.();
      const onScroll = () => scheduleSync(el);
      el.addEventListener("scroll", onScroll, { passive: true });
      syncOffset(el);
      detach = () => el.removeEventListener("scroll", onScroll);
    };

    const findRoot = () => page.querySelector<HTMLElement>(".web__scroll-root");

    const root = findRoot();
    if (root) attach(root);

    const onResize = () => scheduleWebsiteBelowScrollRangeSync(page);
    window.addEventListener("resize", onResize, { passive: true });
    page.addEventListener("load", onResize, true);

    const below = page.querySelector<HTMLElement>(".web__below-scroll");
    const belowResize = below
      ? new ResizeObserver(() => scheduleWebsiteBelowScrollRangeSync(page))
      : null;
    belowResize?.observe(below!);

    const experience = page.querySelector<HTMLElement>(".web__experience");
    const rootObserver = new MutationObserver(() => {
      const el = findRoot();
      if (el) attach(el);
    });
    if (experience) {
      rootObserver.observe(experience, { childList: true, subtree: true });
    }

    return () => {
      belowResize?.disconnect();
      rootObserver.disconnect();
      detach?.();
      window.removeEventListener("resize", onResize);
      page.removeEventListener("load", onResize, true);
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      if (tailRaf.current) cancelAnimationFrame(tailRaf.current);
      resetWebsiteScrollCompositing();
    };
  }, []);

  return null;
}
