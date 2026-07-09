import { useEffect, useRef } from "react";
import { getImmediateScrollOffset } from "../../components/three/scrollOffset";
import { applyWebsiteBelowScrollRange } from "./websiteBelowScrollMeasure";
import { applyWebsiteScrollStats } from "./websiteScrollCss";
import { getWebsiteScrollVarState } from "./websiteScrollCssState";
import { resetWebsiteScrollDriver } from "./websiteScrollDriver";
import { resetWebsiteScrollCompositing } from "./websiteScrollCompositor";
import { resetWebsiteHeroTowerMeshMounted } from "./websiteHeroTowerMounted";
import {
  WEBSITE_HOLD_PAGE_COUNT,
  WEBSITE_INTRO_PAGE_COUNT,
  WEBSITE_SCROLL_PAGES,
} from "./websiteScrollConfig";
import { resetWebsiteTowerOrbit } from "./websiteTowerOrbit";
import { setWebsiteScrollRoot } from "./websiteScrollRoot";

function IntroSpacer({ index }: { index: number }) {
  return (
    <section
      key={`intro-${index}`}
      className="web__scroll-panel web__scroll-panel--spacer"
      aria-hidden
    />
  );
}

function PageSpacer({ index }: { index: number }) {
  return (
    <section
      key={`page-${index}`}
      className="web__scroll-panel web__scroll-panel--page"
      aria-hidden
    />
  );
}

function HoldSpacer({ index }: { index: number }) {
  return (
    <section
      key={`hold-${index}`}
      className="web__scroll-panel web__scroll-panel--hold"
      aria-hidden
    />
  );
}

/** DOM scroll root — replaces drei ScrollControls after the static hero redesign */
export function WebsitePageScrollRoot() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    el.classList.add("web__scroll-root");
    resetWebsiteScrollDriver();
    resetWebsiteTowerOrbit();
    resetWebsiteHeroTowerMeshMounted();
    document.documentElement.classList.add("web-scrolling");
    document.body.classList.add("web-scrolling");
    setWebsiteScrollRoot(el);

    window.dispatchEvent(new Event("hub-tower-invalidate"));

    const page = document.querySelector<HTMLElement>(".web-page");
    if (page) {
      applyWebsiteBelowScrollRange(page);
      applyWebsiteScrollStats(
        getImmediateScrollOffset(el),
        page,
        getWebsiteScrollVarState(),
      );
    }

    const onResize = () => page && applyWebsiteBelowScrollRange(page);
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("resize", onResize);
      el.classList.remove("web__scroll-root");
      document.documentElement.classList.remove("web-scrolling");
      document.body.classList.remove("web-scrolling");
      setWebsiteScrollRoot(null);
      resetWebsiteScrollDriver();
      resetWebsiteTowerOrbit();
      resetWebsiteHeroTowerMeshMounted();
      page?.style.removeProperty("--web-scroll-offset");
      page?.style.removeProperty("--web-intro-blend");
      page?.style.removeProperty("--web-sky-blend");
      page?.style.removeProperty("--web-sky-zenith");
      page?.style.removeProperty("--web-sky-mid");
      page?.style.removeProperty("--web-sky-horizon");
      page?.style.removeProperty("--web-sky-handoff");
      page?.style.removeProperty("--web-page-scroll");
      page?.style.removeProperty("--web-below-scroll");
      page?.style.removeProperty("--web-below-scroll-px");
      page?.style.removeProperty("--web-nav-surface");
      page?.classList.remove("web-nav--surfaced");
      page?.style.removeProperty("--web-day-blend");
      resetWebsiteScrollCompositing();
    };
  }, []);

  const liftPages =
    WEBSITE_SCROLL_PAGES - WEBSITE_INTRO_PAGE_COUNT - WEBSITE_HOLD_PAGE_COUNT;

  return (
    <div ref={rootRef} className="web-page-scroll-host" aria-hidden>
      <div className="web__scroll-track">
        {Array.from({ length: WEBSITE_INTRO_PAGE_COUNT }, (_, i) => (
          <IntroSpacer key={`intro-${i}`} index={i} />
        ))}
        {Array.from({ length: WEBSITE_HOLD_PAGE_COUNT }, (_, i) => (
          <HoldSpacer key={`hold-${i}`} index={i} />
        ))}
        {Array.from({ length: liftPages }, (_, i) => (
          <PageSpacer key={`page-${i}`} index={i} />
        ))}
      </div>
    </div>
  );
}
