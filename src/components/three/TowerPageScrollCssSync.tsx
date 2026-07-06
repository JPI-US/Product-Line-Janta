import { useEffect, useRef } from "react";
import { syncDesignerGalleryLayout } from "../ProductHorizontalGallery";
import { getImmediateScrollOffset } from "./scrollOffset";
import { applyScrollStats } from "./towerScrollCss";
import { getSharedScrollVarState } from "./towerScrollCssState";

/**
 * Sole page-level scroll → CSS sync (immediate wheel position).
 */
export function TowerPageScrollCssSync() {
  const scrollRaf = useRef(0);
  const tailRaf = useRef(0);
  const scrollingUntil = useRef(0);

  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".tower-3d-page");
    if (!page) return;

    const syncImmediate = (el: HTMLElement) => {
      if (
        !page.dataset.galleryReady &&
        page.querySelector(".tower-3d__h-gallery")
      ) {
        syncDesignerGalleryLayout(page);
      }
      applyScrollStats(
        getImmediateScrollOffset(el),
        page,
        getSharedScrollVarState()
      );
    };

    const runTail = () => {
      if (performance.now() >= scrollingUntil.current) {
        tailRaf.current = 0;
        return;
      }
      const el = page.querySelector<HTMLElement>(".tower-3d__scroll-root");
      if (el) syncImmediate(el);
      tailRaf.current = requestAnimationFrame(runTail);
    };

    const scheduleSync = (el: HTMLElement) => {
      scrollingUntil.current = performance.now() + 90;
      if (!tailRaf.current) tailRaf.current = requestAnimationFrame(runTail);
      if (scrollRaf.current) return;
      scrollRaf.current = requestAnimationFrame(() => {
        scrollRaf.current = 0;
        syncImmediate(el);
      });
    };

    let detach: (() => void) | null = null;

    const attach = (el: HTMLElement) => {
      detach?.();
      const onScroll = () => scheduleSync(el);
      el.addEventListener("scroll", onScroll, { passive: true });
      syncImmediate(el);
      detach = () => el.removeEventListener("scroll", onScroll);
    };

    const findRoot = () =>
      page.querySelector<HTMLElement>(".tower-3d__scroll-root");

    const root = findRoot();
    if (root) attach(root);

    const observer = new MutationObserver(() => {
      const el = findRoot();
      if (el) attach(el);
    });
    observer.observe(page, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      detach?.();
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      if (tailRaf.current) cancelAnimationFrame(tailRaf.current);
    };
  }, []);

  return null;
}
