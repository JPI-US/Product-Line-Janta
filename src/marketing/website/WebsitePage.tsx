import { HubPreviewProvider } from "../../context/HubPreviewContext";
import { WebsiteContent } from "./WebsiteContent";
import { WebsiteHeroShell } from "../../components/site/WebsiteHeroShell";
import { WebsiteHubHeroProvider } from "./WebsiteHubHeroContext";
import { WebsiteMarketingShell } from "./WebsiteMarketingShell";
import { WebsitePageScroll } from "./WebsitePageScroll";
import { WebsitePageScrollCssSync } from "./WebsitePageScrollCssSync";
import { WebsitePageScrollRoot } from "./WebsitePageScrollRoot";
import { useDocumentMeta } from "../../lib/useDocumentMeta";

export default function WebsitePage() {
  useDocumentMeta({
    title: "Three-Dimensional Solar",
    description:
      "Janta Power builds three-dimensional solar towers that generate more energy from less land — reliable, dense, affordable clean power.",
  });
  return (
    <HubPreviewProvider>
      <WebsiteHubHeroProvider>
        <WebsiteMarketingShell variant="hub-hero">
          <WebsitePageScrollRoot />
          <WebsitePageScrollCssSync />
          <WebsitePageScroll />

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
