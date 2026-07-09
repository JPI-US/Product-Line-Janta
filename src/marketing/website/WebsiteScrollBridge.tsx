import { useScroll } from "@react-three/drei";
import { useEffect } from "react";
import { getImmediateScrollOffset } from "../../components/three/scrollOffset";
import { applyWebsiteBelowScrollRange } from "./websiteBelowScrollMeasure";
import { applyWebsiteScrollStats } from "./websiteScrollCss";
import { getWebsiteScrollVarState } from "./websiteScrollCssState";
import { resetWebsiteScrollDriver } from "./websiteScrollDriver";
import { resetWebsiteTowerOrbit } from "./websiteTowerOrbit";
import { resetWebsiteScrollCompositing } from "./websiteScrollCompositor";
import { resetWebsiteHeroTowerMeshMounted } from "./websiteHeroTowerMounted";
import { setWebsiteScrollRoot } from "./websiteScrollRoot";

/** Registers drei scroll root — same pattern as product tower pages */
export function WebsiteScrollBridge() {
  const scroll = useScroll();

  useEffect(() => {
    scroll.el.classList.add("web__scroll-root");
    resetWebsiteScrollDriver();
    resetWebsiteTowerOrbit();
    resetWebsiteHeroTowerMeshMounted();
    document.documentElement.classList.add("web-scrolling");
    document.body.classList.add("web-scrolling");
    setWebsiteScrollRoot(scroll.el);

    window.dispatchEvent(new Event("hub-tower-invalidate"));

    const page = document.querySelector<HTMLElement>(".web-page");
    if (page) {
      applyWebsiteBelowScrollRange(page);
      applyWebsiteScrollStats(
        getImmediateScrollOffset(scroll.el),
        page,
        getWebsiteScrollVarState()
      );
    }

    const onResize = () => page && applyWebsiteBelowScrollRange(page);
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("resize", onResize);
      scroll.el.classList.remove("web__scroll-root");
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
  }, [scroll.el]);

  return null;
}
