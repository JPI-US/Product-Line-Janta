import { lazy, Suspense, type ReactNode } from "react";
import {
  WebsiteBenefitsSection,
  WebsiteSolutionsSection,
} from "./WebsiteLandingSections";
import { WebsiteDeferredSection } from "./WebsiteDeferredSection";

const WebsiteApplicationsSection = lazy(() =>
  import("./WebsiteApplicationsSection").then((m) => ({
    default: m.WebsiteApplicationsSection,
  })),
);
const WebsiteVisionSection = lazy(() =>
  import("./WebsiteVisionSection").then((m) => ({
    default: m.WebsiteVisionSection,
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
const WebsiteMediaSection = lazy(() =>
  import("./WebsiteMediaSection").then((m) => ({
    default: m.WebsiteMediaSection,
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

function LazySection({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export function WebsiteContent() {
  return (
    <>
      <WebsiteDeferredSection mountImmediately>
        <WebsiteBenefitsSection />
      </WebsiteDeferredSection>
      <WebsiteDeferredSection minHeight="min(58vh, 520px)">
        <LazySection>
          <WebsiteApplicationsSection />
        </LazySection>
      </WebsiteDeferredSection>
      <WebsiteDeferredSection minHeight="min(100vh, 720px)">
        <LazySection>
          <WebsiteVisionSection />
        </LazySection>
      </WebsiteDeferredSection>
      <div className="web-landing-sky-band">
        <WebsiteDeferredSection>
          <LazySection>
            <WebsiteValueSection />
          </LazySection>
        </WebsiteDeferredSection>
      </div>
      <WebsiteDeferredSection minHeight="min(80vh, 720px)">
        <LazySection>
          <WebsiteSoftwareShowcaseSection />
        </LazySection>
      </WebsiteDeferredSection>
      <div className="web-landing-sky-band web-landing-sky-band--solutions-media">
        <WebsiteDeferredSection minHeight="min(52vh, 480px)">
          <LazySection>
            <WebsiteSolutionsSection />
          </LazySection>
        </WebsiteDeferredSection>
        <WebsiteDeferredSection>
          <LazySection>
            <WebsiteMediaSection />
          </LazySection>
        </WebsiteDeferredSection>
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
