import { useLayoutEffect, useRef } from "react";
import { applyWebsiteBelowScrollRange } from "./websiteBelowScrollMeasure";
import { subscribeWebsiteScrollRoot } from "./websiteScrollRoot";
import { VISION_EYEBROW, VISION_HERO_IMAGE, VISION_STATEMENT_LINES } from "./websiteData";
import {
  getVisionWordOpacity,
  measureVisionReveal,
  resetVisionNavHeightCache,
} from "./websiteVisionReveal";

const VISION_EYEBROW_WORDS = VISION_EYEBROW.split(" ");
const VISION_STATEMENT_WORDS = VISION_STATEMENT_LINES.flatMap((line) =>
  line.split(" "),
);
const VISION_WORDS = [...VISION_EYEBROW_WORDS, ...VISION_STATEMENT_WORDS];
const VISION_STATEMENT_WORD_OFFSET = VISION_EYEBROW_WORDS.length;

let visionWordOffset = VISION_STATEMENT_WORD_OFFSET;
const VISION_RENDER_LINES = VISION_STATEMENT_LINES.map((line) => {
  const words = line.split(" ");
  const start = visionWordOffset;
  visionWordOffset += words.length;
  return { words, start };
});

/** Full-bleed photo + scroll-driven copy reveal */
export function WebsiteVisionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lastRevealRef = useRef(-1);
  const wordOpacityRef = useRef<number[]>([]);
  const schedulePaintRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const showAllWords = () => {
      const count = VISION_WORDS.length;
      for (let i = 0; i < count; i++) {
        const el = wordRefs.current[i];
        if (!el) continue;
        el.style.opacity = "1";
        el.style.transform = "translate3d(0, 0, 0)";
      }
      wordOpacityRef.current = Array.from({ length: count }, () => 1);
      lastRevealRef.current = 1;
    };

    if (reducedMotion) {
      showAllWords();
      return;
    }

    let raf = 0;
    let ticking = false;

    const paint = () => {
      ticking = false;

      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight;
      if (rect.bottom < -viewH * 0.25 || rect.top > viewH * 2.5) return;

      const reveal = measureVisionReveal(section);
      if (reveal <= 0) {
        if (lastRevealRef.current <= 0) return;
        lastRevealRef.current = 0;
        const count = VISION_WORDS.length;
        for (let i = 0; i < count; i++) {
          const el = wordRefs.current[i];
          if (!el) continue;
          el.style.opacity = "0";
          el.style.transform = "translate3d(0, 0.35em, 0)";
        }
        wordOpacityRef.current = Array.from({ length: count }, () => 0);
        return;
      }

      if (Math.abs(reveal - lastRevealRef.current) < 0.012) return;
      lastRevealRef.current = reveal;

      const count = VISION_WORDS.length;
      const opacities = wordOpacityRef.current;

      for (let i = 0; i < count; i++) {
        const el = wordRefs.current[i];
        if (!el) continue;
        const progress = getVisionWordOpacity(reveal, i, count);
        const prev = opacities[i] ?? -1;
        if (Math.abs(progress - prev) < 0.02) continue;
        opacities[i] = progress;
        el.style.opacity = String(progress);
        el.style.transform = `translate3d(0, ${(1 - progress) * 0.35}em, 0)`;
      }
    };

    const schedulePaint = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(paint);
    };

    schedulePaintRef.current = schedulePaint;

    let detachScroll: (() => void) | null = null;
    let nearSection = false;

    const attachScroll = (root: HTMLElement | null) => {
      detachScroll?.();
      if (!root || !nearSection) {
        detachScroll = null;
        return;
      }
      root.addEventListener("scroll", schedulePaint, { passive: true });
      detachScroll = () => root.removeEventListener("scroll", schedulePaint);
    };

    const unsubscribeRoot = subscribeWebsiteScrollRoot(attachScroll);

    const onResize = () => {
      resetVisionNavHeightCache();
      if (nearSection) schedulePaint();
    };
    window.addEventListener("resize", onResize, { passive: true });

    const statement = section.querySelector<HTMLElement>(".web-vision-statement");

    const observer = new IntersectionObserver(
      ([entry]) => {
        nearSection = entry.isIntersecting;
        if (nearSection) {
          schedulePaint();
          const root = document.querySelector<HTMLElement>(".web__scroll-root");
          attachScroll(root);
          return;
        }
        detachScroll?.();
        detachScroll = null;
      },
      { rootMargin: "0px", threshold: 0 },
    );
    observer.observe(statement ?? section);

    schedulePaint();
    requestAnimationFrame(schedulePaint);

    return () => {
      schedulePaintRef.current = null;
      cancelAnimationFrame(raf);
      detachScroll?.();
      unsubscribeRoot();
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="web-panel web-panel--vision"
      aria-label="Our Vision"
    >
      <div className="web-vision-hero">
          <div className="web-vision-hero__media" aria-hidden>
            <div className="web-vision-hero__sky-tint" aria-hidden />
            <img
              className="web-vision-hero__img"
              src={VISION_HERO_IMAGE}
              alt=""
              decoding="async"
              loading="lazy"
              onLoad={() => {
                const page = document.querySelector<HTMLElement>(".web-page");
                if (page) applyWebsiteBelowScrollRange(page);
                schedulePaintRef.current?.();
              }}
            />
          </div>
          <div className="web-vision-hero__scrim" aria-hidden />
          <div className="web-vision-hero__copy">
            <p className="web-vision-eyebrow">
              {VISION_EYEBROW_WORDS.map((word, index) => (
                <span
                  key={`eyebrow-${word}-${index}`}
                  ref={(el) => {
                    wordRefs.current[index] = el;
                  }}
                  className="web-vision__word"
                  style={{ opacity: 0 }}
                >
                  {word}
                  {index < VISION_EYEBROW_WORDS.length - 1 ? "\u00a0" : ""}
                </span>
              ))}
            </p>
            <p className="web-vision-statement">
              {VISION_RENDER_LINES.map(({ words, start }, lineIndex) => (
                <span key={lineIndex} className="web-vision-statement__line">
                  {words.map((word, indexInLine) => {
                    const index = start + indexInLine;

                    return (
                      <span
                        key={`${word}-${index}`}
                        ref={(el) => {
                          wordRefs.current[index] = el;
                        }}
                        className="web-vision__word"
                        style={{ opacity: 0 }}
                      >
                        {word}
                        {indexInLine < words.length - 1 ? "\u00a0" : ""}
                      </span>
                    );
                  })}
                </span>
              ))}
            </p>
          </div>
        </div>
    </section>
  );
}
