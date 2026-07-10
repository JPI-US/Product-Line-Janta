import { HubPreviewProvider } from "../../context/HubPreviewContext";
import { WebsiteContent } from "./WebsiteContent";
import { WebsiteHeroShell } from "../../components/site/WebsiteHeroShell";
import { WebsiteHubHeroProvider } from "./WebsiteHubHeroContext";
import { WebsiteMarketingShell } from "./WebsiteMarketingShell";
import { WebsitePageScroll } from "./WebsitePageScroll";
import { WebsitePageScrollCssSync } from "./WebsitePageScrollCssSync";
import { WebsitePageScrollRoot } from "./WebsitePageScrollRoot";
import { useDocumentMeta } from "../../lib/useDocumentMeta";
import { useIsMobile } from "../../lib/useIsMobile";

export default function WebsitePage() {
  useDocumentMeta({
    title: "Three-Dimensional Solar",
    description:
      "Janta Power builds three-dimensional solar towers that generate more energy from less land — reliable, dense, affordable clean power.",
  });
  // Phones scroll natively (no scroll-hijack rig): the fixed-position "fake
  // scroll" driver fights touch momentum and janks. Rendering the rig only on
  // desktop keeps the choreographed experience there while the mobile layout
  // flows as a normal document (see .web-page--mobile-native in website.css).
  const isMobile = useIsMobile();
  return (
    <HubPreviewProvider>
      <WebsiteHubHeroProvider>
        <WebsiteMarketingShell
          variant="hub-hero"
          className={isMobile ? "web-page--mobile-native" : undefined}
        >
          {!isMobile && (
            <>
              <WebsitePageScrollRoot />
              <WebsitePageScrollCssSync />
              <WebsitePageScroll />
            </>
          )}

          <div className="web__experience">
            <WebsiteHeroShell />
          </div>

          <section className="web__page-below" aria-label="Website content">
            <div className="web__below-scroll">
              <WebsiteContent />
            </div>
          </section>
        </WebsiteMarketingShell>
      </WebsiteHubHeroProvider>
    </HubPreviewProvider>
  );
}
