import { Scroll, ScrollControls } from "@react-three/drei";
import { Suspense } from "react";
import { TOWER_CANVAS_GL } from "../../components/three/sceneConfig";
import { WebsiteHubTowerBridge } from "./WebsiteHubTowerBridge";
import { WebsiteScrollBridge } from "./WebsiteScrollBridge";
import { WebsiteScrollSync } from "./WebsiteScrollSync";
import {
  WEBSITE_HOLD_PAGE_COUNT,
  WEBSITE_INTRO_PAGE_COUNT,
  WEBSITE_SCROLL_PAGES,
} from "./websiteScrollConfig";

const HUB_CANVAS_GL = {
  ...TOWER_CANVAS_GL,
  alpha: true,
  antialias: false,
  failIfMajorPerformanceCaveat: false,
} as const;

/** Hero canvas — cap DPR for smoother scroll on HiDPI displays */
const WEBSITE_CANVAS_DPR: [number, number] = [1, 1];

function IntroSpacer() {
  return (
    <section
      className="web__scroll-panel web__scroll-panel--spacer"
      aria-hidden
    />
  );
}

function PageSpacer() {
  return (
    <section className="web__scroll-panel web__scroll-panel--page" aria-hidden />
  );
}

function HoldSpacer() {
  return (
    <section
      className="web__scroll-panel web__scroll-panel--hold"
      aria-hidden
    />
  );
}

export function WebsiteScrollScene() {
  const liftPages =
    WEBSITE_SCROLL_PAGES - WEBSITE_INTRO_PAGE_COUNT - WEBSITE_HOLD_PAGE_COUNT;

  return (
    <ScrollControls pages={WEBSITE_SCROLL_PAGES} damping={0.17} distance={1} eps={0.0005}>
      <WebsiteScrollBridge />
      <WebsiteScrollSync />
      <Suspense fallback={null}>
        <WebsiteHubTowerBridge />
      </Suspense>

      <Scroll html style={{ width: "100%", pointerEvents: "none" }}>
        <div className="web__scroll-track">
          {Array.from({ length: WEBSITE_INTRO_PAGE_COUNT }, (_, i) => (
            <IntroSpacer key={`intro-${i}`} />
          ))}
          {Array.from({ length: WEBSITE_HOLD_PAGE_COUNT }, (_, i) => (
            <HoldSpacer key={`hold-${i}`} />
          ))}
          {Array.from({ length: liftPages }, (_, i) => (
            <PageSpacer key={`page-${i}`} />
          ))}
        </div>
      </Scroll>
    </ScrollControls>
  );
}

export { HUB_CANVAS_GL, WEBSITE_CANVAS_DPR as TOWER_CANVAS_DPR };
