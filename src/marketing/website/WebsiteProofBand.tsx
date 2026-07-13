import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ROI_COPY } from "./websiteData";
import { WEBSITE_REACT_BITS } from "./websiteReactBitsConfig";
import { useReactBitActive } from "./useWebsiteReducedMotion";

const DarkVeil = lazy(() => import("./react-bits/DarkVeil/DarkVeil"));

export function WebsiteRoiSection() {
  const darkVeilActive = useReactBitActive("roiDarkVeil");
  const veilCfg = WEBSITE_REACT_BITS.roiDarkVeil;
  const veilHostRef = useRef<HTMLDivElement>(null);
  const [veilInView, setVeilInView] = useState(false);

  useEffect(() => {
    const host = veilHostRef.current;
    if (!host || !darkVeilActive) {
      setVeilInView(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVeilInView(entry.isIntersecting),
      { rootMargin: "48px 0px", threshold: 0.12 },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [darkVeilActive]);

  return (
    <section
      id="web-cta-band"
      className="web-panel web-panel--ps-roi"
      aria-labelledby="web-roi-title"
    >
      <div className="web-ps-roi">
          <img
            className="web-ps-roi__img"
            src={ROI_COPY.image}
            alt={ROI_COPY.imageAlt}
            loading="lazy"
            decoding="async"
          />
          {darkVeilActive ? (
            <div
              ref={veilHostRef}
              className="web-rb-bg-layer web-rb-bg-layer--roi"
              aria-hidden
              style={{ "--web-rb-veil-opacity": veilCfg.opacity } as CSSProperties}
            >
              {veilInView ? (
                <Suspense fallback={null}>
                  <DarkVeil
                    hueShift={veilCfg.hueShift}
                    speed={veilCfg.speed}
                    noiseIntensity={veilCfg.noiseIntensity}
                    resolutionScale={veilCfg.resolutionScale}
                  />
                </Suspense>
              ) : null}
            </div>
          ) : null}
          <div className="web-ps-roi__scrim" aria-hidden />
          <div className="web-panel__content web-ps-roi__copy">
            <h2 id="web-roi-title" className="web-ps-roi__title">
              {ROI_COPY.title}
            </h2>
            <p className="web-ps-roi__body">{ROI_COPY.body}</p>
            <div className="web-ps-roi__actions">
              <Link
                className="web-ps-roi__btn web-ps-roi__btn--primary"
                to={ROI_COPY.savingsHref}
              >
                {ROI_COPY.savingsCta}
              </Link>
            </div>
          </div>
        </div>
    </section>
  );
}
