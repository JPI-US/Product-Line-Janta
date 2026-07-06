import { lazy, Suspense, useEffect, useRef } from "react";
import { HubSkyBackground } from "../../components/HubSkyBackground";
import { useHubPreview } from "../../context/HubPreviewContext";
import { WebsiteHeroLayer } from "./WebsiteHeroLayer";
import { useWebsiteHubHero } from "./WebsiteHubHeroContext";
import { WEBSITE_HERO_WEATHER } from "./websiteHeroWeather";
import { useWebsiteHeroCanvasActive } from "./useWebsiteHeroCanvasActive";
import { mountWebsiteHeroCanvasGate } from "./websiteHeroCanvasGate";
import { WEBSITE_HUB_TOWER } from "./websiteHubTowerConfig";
import { WebsiteTowerDragSurface } from "./WebsiteTowerDragSurface";
import { WebsitePartnersSection } from "./WebsitePartnersSection";

const WebsiteExperience = lazy(() =>
  import("./WebsiteExperience").then((m) => ({
    default: m.WebsiteExperience,
  })),
);

/** Living sky + scroll tower with marketing hero copy */
export function WebsiteHeroProductLine() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroCanvasActive = useWebsiteHeroCanvasActive();
  const { coords } = useWebsiteHubHero();
  const { previewDate } = useHubPreview();

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    return mountWebsiteHeroCanvasGate(el);
  }, []);

  return (
    <div
      ref={heroRef}
      className={
        heroCanvasActive
          ? "web-hero-product-line"
          : "web-hero-product-line web-hero-product-line--canvas-paused"
      }
    >
      <HubSkyBackground
        weather={WEBSITE_HERO_WEATHER}
        coords={coords}
        previewDate={previewDate}
        marketingHero
        towerLayout={WEBSITE_HUB_TOWER}
      />
      <div className="web-hero-product-line__stage">
        <div
          className="web__viewport web__viewport--hub"
          aria-hidden={!heroCanvasActive}
        >
          <Suspense fallback={null}>
            <WebsiteExperience />
          </Suspense>
        </div>
        {heroCanvasActive ? <WebsiteTowerDragSurface /> : null}
        <WebsiteHeroLayer />
      </div>
      <WebsitePartnersSection className="web-partners--hero-band" />
    </div>
  );
}
