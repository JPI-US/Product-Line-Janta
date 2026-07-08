import { Component, ReactNode, useEffect, useRef, useState } from "react";
import { HubSkyBackground } from "../../components/HubSkyBackground";
import { WebsiteHeroBoot } from "./WebsiteHeroBoot";
import { useHubPreview } from "../../context/HubPreviewContext";
import { WebsiteExperience } from "./WebsiteExperience";
import { WebsiteHeroLayer } from "./WebsiteHeroLayer";
import { useWebsiteHubHero } from "./WebsiteHubHeroContext";
import { WEBSITE_HERO_WEATHER } from "./websiteHeroWeather";
import { useWebsiteHeroCanvasActive } from "./useWebsiteHeroCanvasActive";
import { useWebGLSupported } from "./useWebsiteReducedMotion";
import { mountWebsiteHeroCanvasGate } from "./websiteHeroCanvasGate";
import { WEBSITE_HUB_TOWER } from "./websiteHubTowerConfig";
import { WebsiteTowerDragSurface } from "./WebsiteTowerDragSurface";
import { WebsitePartnersSection } from "./WebsitePartnersSection";

/** Isolate WebGL context creation failures so the marketing page still renders. */
class WebGLErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    // eslint-disable-next-line no-console
    console.warn("[website-hero] canvas disabled:", err);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Living sky + scroll tower with marketing hero copy */
export function WebsiteHeroProductLine() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroCanvasActive = useWebsiteHeroCanvasActive();
  const webglSupported = useWebGLSupported();
  const [booting, setBooting] = useState(true);
  const { coords } = useWebsiteHubHero();
  const { previewDate } = useHubPreview();

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    return mountWebsiteHeroCanvasGate(el);
  }, []);

  const classNames = ["web-hero-product-line"];
  if (!heroCanvasActive) classNames.push("web-hero-product-line--canvas-paused");
  if (booting && webglSupported) classNames.push("web-hero-product-line--booting");

  return (
    <div ref={heroRef} className={classNames.join(" ")}>
      <HubSkyBackground
        weather={WEBSITE_HERO_WEATHER}
        coords={coords}
        previewDate={previewDate}
        marketingHero
        towerLayout={WEBSITE_HUB_TOWER}
      />
      <div className="web-hero-product-line__stage">
        {webglSupported ? (
          <div
            className="web__viewport web__viewport--hub"
            aria-hidden={!heroCanvasActive}
          >
            <WebGLErrorBoundary>
              <WebsiteExperience />
            </WebGLErrorBoundary>
          </div>
        ) : null}
        {webglSupported && heroCanvasActive ? <WebsiteTowerDragSurface /> : null}
        <WebsiteHeroLayer />
        {webglSupported ? (
          <WebsiteHeroBoot onDone={() => setBooting(false)} />
        ) : null}
      </div>
      <WebsitePartnersSection className="web-partners--hero-band" />
    </div>
  );
}
