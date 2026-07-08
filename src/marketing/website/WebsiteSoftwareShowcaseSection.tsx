import { useEffect, useRef, useState } from "react";
import { WebsiteJantaOsDashboardEmbed } from "./WebsiteJantaOsDashboardEmbed";
import { SOFTWARE_SHOWCASE_COPY } from "./websiteData";
import { useWebsiteReducedMotion } from "./useWebsiteReducedMotion";

/** Software dashboard — live Janta OS UI in a tablet frame */
export function WebsiteSoftwareShowcaseSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reducedMotion = useWebsiteReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let unmountTimer = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setActive(visible);
        if (visible) {
          window.clearTimeout(unmountTimer);
          setMounted(true);
          return;
        }
        window.clearTimeout(unmountTimer);
        unmountTimer = window.setTimeout(() => setMounted(false), 2000);
      },
      { rootMargin: "64px 0px", threshold: 0.1 },
    );
    observer.observe(section);
    return () => {
      window.clearTimeout(unmountTimer);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setAnimate(false);
          return;
        }
        setAnimate(entry.intersectionRatio >= 0.58);
      },
      { rootMargin: "-4% 0px -4% 0px", threshold: [0, 0.4, 0.5, 0.58, 0.72, 0.9] },
    );
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [mounted]);

  const showLiveDashboard = mounted && !reducedMotion;

  return (
    <section
      ref={sectionRef}
      id="web-software-showcase"
      className="web-panel web-panel--software-showcase"
      aria-labelledby="web-software-showcase-title"
    >
      <div
        className="web-software-showcase__texture web-brand-blue-texture web-brand-blue-texture--grid"
        aria-hidden
      />

      <div className="web-software-showcase__inner">
        <h2 id="web-software-showcase-title" className="web-software-showcase__title">
          {SOFTWARE_SHOWCASE_COPY.title}
        </h2>

        <div className="web-software-showcase__tablet">
          <div ref={viewportRef} className="web-software-showcase__screen-viewport">
            {showLiveDashboard ? (
              <WebsiteJantaOsDashboardEmbed active={active} animate={animate} />
            ) : (
              <img
                className="web-software-showcase__screen"
                src={SOFTWARE_SHOWCASE_COPY.poster}
                alt={SOFTWARE_SHOWCASE_COPY.imageAlt}
                loading="lazy"
                decoding="async"
              />
            )}
            {showLiveDashboard && active ? (
              <div className="web-software-showcase__screen-shine" aria-hidden />
            ) : null}
          </div>
        </div>

        <p className="web-software-showcase__body">{SOFTWARE_SHOWCASE_COPY.body}</p>
        <a
          className="web-ps-roi__btn web-ps-roi__btn--primary web-software-showcase__btn"
          href={SOFTWARE_SHOWCASE_COPY.ctaHref}
        >
          {SOFTWARE_SHOWCASE_COPY.cta}
        </a>
      </div>
    </section>
  );
}
