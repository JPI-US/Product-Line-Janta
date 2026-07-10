import { lazy, Suspense, type ReactNode } from "react";
import { useIsMobile } from "../../lib/useIsMobile";
import { WebsiteDeferredSection } from "./WebsiteDeferredSection";

const WebsiteApplicationsSection = lazy(() =>
  import("./WebsiteApplicationsSection").then((m) => ({
    default: m.WebsiteApplicationsSection,
  })),
);
const WebsiteYieldSection = lazy(() =>
  import("./WebsiteYieldSection").then((m) => ({
    default: m.WebsiteYieldSection,
  })),
);
const WebsiteYieldComparisonSection = lazy(() =>
  import("./WebsiteYieldComparisonSection").then((m) => ({
    default: m.WebsiteYieldComparisonSection,
  })),
);
const WebsitePowerProfileSection = lazy(() =>
  import("./WebsitePowerProfileSection").then((m) => ({
    default: m.WebsitePowerProfileSection,
  })),
);
const WebsiteValueSection = lazy(() =>
  import("./WebsiteValueSection").then((m) => ({
    default: m.WebsiteValueSection,
  })),
);
const WebsiteSoftwareShowcaseSection = lazy(() =>
  import("./WebsiteSoftwareShowcaseSection").then((m) => ({
    default: m.WebsiteSoftwareShowcaseSection,
  })),
);
const WebsiteSpecsHighlight = lazy(() =>
  import("./WebsiteSpecsHighlight").then((m) => ({
    default: m.WebsiteSpecsHighlight,
  })),
);
const WebsiteRoiSection = lazy(() =>
  import("./WebsiteProofBand").then((m) => ({
    default: m.WebsiteRoiSection,
  })),
);
const PremiumGlobe = lazy(() =>
  import("../../components/PremiumGlobe").then((m) => ({
    default: m.PremiumGlobe,
  })),
);
// Static, three-free globe section for phones — keeps three.js off mobile.
const WebsiteGlobeMobile = lazy(() =>
  import("./WebsiteGlobeMobile").then((m) => ({
    default: m.WebsiteGlobeMobile,
  })),
);
const WebsiteFooter = lazy(() =>
  import("./WebsiteFooter").then((m) => ({
    default: m.WebsiteFooter,
  })),
);

function LazySection({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export function WebsiteContent() {
  const isMobile = useIsMobile();
  return (
    <>
      <div className="web-landing-sky-band">
        <WebsiteDeferredSection minHeight="min(90vh, 820px)">
          <LazySection>
            <WebsiteValueSection />
          </LazySection>
        </WebsiteDeferredSection>
        <WebsiteDeferredSection minHeight="min(58vh, 520px)">
          <LazySection>
            <WebsiteApplicationsSection />
          </LazySection>
        </WebsiteDeferredSection>
        <WebsiteDeferredSection minHeight="min(70vh, 620px)">
          <LazySection>
            <WebsiteYieldSection />
          </LazySection>
        </WebsiteDeferredSection>
        <WebsiteDeferredSection minHeight="min(70vh, 620px)">
          <LazySection>
            <WebsiteYieldComparisonSection />
          </LazySection>
        </WebsiteDeferredSection>
        <WebsiteDeferredSection minHeight="min(52vh, 480px)">
          <LazySection>
            <WebsiteSpecsHighlight />
          </LazySection>
        </WebsiteDeferredSection>
      </div>
      <WebsiteDeferredSection minHeight="min(80vh, 720px)">
        <LazySection>
          <WebsiteSoftwareShowcaseSection />
        </LazySection>
      </WebsiteDeferredSection>
      <div className="web-landing-sky-band web-landing-sky-band--solutions-media">
        <WebsiteDeferredSection minHeight="min(80vh, 700px)">
          <LazySection>
            <WebsitePowerProfileSection />
          </LazySection>
        </WebsiteDeferredSection>
        <WebsiteDeferredSection minHeight="min(90vh, 820px)">
          <LazySection>
            {isMobile ? <WebsiteGlobeMobile /> : <PremiumGlobe />}
          </LazySection>
        </WebsiteDeferredSection>
      </div>
      <WebsiteDeferredSection>
        <LazySection>
          <WebsiteRoiSection />
        </LazySection>
      </WebsiteDeferredSection>
      <WebsiteDeferredSection mountImmediately>
        <LazySection>
          <WebsiteFooter />
        </LazySection>
      </WebsiteDeferredSection>
    </>
  );
}
