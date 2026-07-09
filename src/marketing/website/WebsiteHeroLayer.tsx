import { lazy, Suspense, useEffect, useState } from "react";
import { HERO_COPY } from "./websiteData";
import { WEBSITE_REACT_BITS } from "./websiteReactBitsConfig";
import { useReactBitActive, useWebsiteReducedMotion } from "./useWebsiteReducedMotion";

const TextType = lazy(() => import("./react-bits/TextType/TextType"));

/** Marketing hero copy over the living sky + scroll tower */
export function WebsiteHeroLayer() {
  const textTypeActive = useReactBitActive("heroTextType");
  const typeCfg = WEBSITE_REACT_BITS.heroTextType;
  const reducedMotion = useWebsiteReducedMotion();
  const [titleReady, setTitleReady] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.requestAnimationFrame(() => setTitleReady(true));
    return () => window.cancelAnimationFrame(id);
  }, [reducedMotion]);

  const titleClassName =
    "web-display web-hero-title" +
    (titleReady ? " web-hero-title--ready" : "") +
    (reducedMotion ? " web-hero-title--static" : "");

  return (
    <div className="web-hero-layer" aria-labelledby="web-hero-title">
      <section className="web-panel web-panel--hero">
        <div className="web-panel__vignette" aria-hidden />
        <div className="web-panel__content web-panel__content--hero">
          <h1 id="web-hero-title" className={titleClassName}>
            <span className="web-hero-title__line">{HERO_COPY.title[0]}</span>
            <span className="web-hero-title__line web-display__accent">
              {HERO_COPY.title[1]}
            </span>
          </h1>
          {textTypeActive ? (
            <Suspense fallback={<p className="web-lead">{HERO_COPY.sub}</p>}>
              <TextType
                key={HERO_COPY.sub}
                as="p"
                className="web-lead web-rb-text-type"
                text={HERO_COPY.sub}
                typingSpeed={typeCfg.typingSpeed}
                showCursor={typeCfg.showCursor}
                loop={typeCfg.loop}
                startOnVisible
              />
            </Suspense>
          ) : (
            <p className="web-lead">{HERO_COPY.sub}</p>
          )}
          <div className="web-scroll-hint" aria-hidden>
            <span>Scroll</span>
            <div className="web-scroll-hint__line" />
          </div>
        </div>
      </section>
    </div>
  );
}
