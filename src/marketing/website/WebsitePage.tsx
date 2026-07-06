import { HubPreviewProvider } from "../../context/HubPreviewContext";
import { WebsiteContent } from "./WebsiteContent";
import { WebsiteHeroProductLine } from "./WebsiteHeroProductLine";
import { WebsiteHubHeroProvider } from "./WebsiteHubHeroContext";
import { WebsiteMarketingShell } from "./WebsiteMarketingShell";
import { WebsitePageScroll } from "./WebsitePageScroll";
import { WebsitePageScrollCssSync } from "./WebsitePageScrollCssSync";
import { WebsitePageWarmup } from "./WebsitePageWarmup";

export default function WebsitePage() {
  return (
    <HubPreviewProvider>
      <WebsiteHubHeroProvider>
        <WebsiteMarketingShell variant="hub-hero">
          <WebsitePageWarmup />
          <WebsitePageScrollCssSync />
          <WebsitePageScroll />

          <div className="web__experience">
            <WebsiteHeroProductLine />
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
