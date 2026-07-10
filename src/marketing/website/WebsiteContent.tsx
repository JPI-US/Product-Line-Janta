import { lazy, Suspense, type ReactNode } from "react";
import { SHOW_GLOBE } from "../../config/featureFlags";
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
const WebsiteFooter = lazy(() =>
  import("./WebsiteFooter").then((m) => ({
    default: m.WebsiteFooter,
  })),
);
// Deferred-launch globe (behind SHOW_GLOBE). Interactive on desktop, static on
// mobile. Lazy so it stays out of the bundle until the flag is turned on.
const PremiumGlobe = lazy(() =>
  import("../../components/PremiumGlobe").then((m) => ({
    default: m.PremiumGlobe,
  })),
);
const WebsiteGlobeMobile = lazy(() =>
  import("./WebsiteGlobeMobile").then((m) => ({
    default: m.WebsiteGlobeMobile,
  })),
);

function LazySection({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export function WebsiteContent() {
  const isMobile = useIsMobile();
  return (
    <>
      <div className="web-landing-sky-band web-landing-sky-band--continuous">
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
        <WebsiteDeferredSection minHeight="min(80vh, 720px)">
          <LazySection>
            <WebsiteSoftwareShowcaseSection />
          </LazySection>
        </WebsiteDeferredSection>
        <WebsiteDeferredSection minHeight="min(68vh, 640px)">
          <LazySection>
            <WebsiteSpecsHighlight />
          </LazySection>
        </WebsiteDeferredSection>
        <WebsiteDeferredSection minHeight="min(80vh, 700px)">
          <LazySection>
            <WebsitePowerProfileSection />
          </LazySection>
        </WebsiteDeferredSection>
        {SHOW_GLOBE && (
          <WebsiteDeferredSection minHeight="min(90vh, 820px)">
            <LazySection>
              {isMobile ? <WebsiteGlobeMobile /> : <PremiumGlobe />}
            </LazySection>
          </WebsiteDeferredSection>
        )}
      </div>
      <WebsiteDeferredSection>
        <LazySection>
          <WebsiteRoiSection />
        </LazySection>
      </WebsiteDeferredSection>
      <WebsiteDeferredSection minHeight="min(48vh, 420px)">
        <LazySection>
          <WebsiteFooter />
        </LazySection>
      </WebsiteDeferredSection>
    </>
  );
}
