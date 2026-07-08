import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { getProductGallerySlides } from "../data/productGallery";
import {
  advanceDesignerGallerySlide,
  setDesignerGallerySlide,
} from "./three/designerGalleryScrub";
import { getTowerScrollRoot } from "./three/towerScrollRoot";
import {
  clearGalleryPinBand,
  markGalleryReady,
  measureGalleryTrackEnd,
} from "./three/galleryScroll";

function syncGalleryLayout(page: HTMLElement) {
  const galleryWrap = page.querySelector<HTMLElement>(
    ".tower-3d__h-gallery-wrap"
  );
  const gallery = galleryWrap?.querySelector<HTMLElement>(
    ".tower-3d__h-gallery"
  );
  const header = gallery?.querySelector<HTMLElement>(
    ".tower-3d__h-gallery__header"
  );
  const stage = gallery?.querySelector<HTMLElement>(".tower-3d__h-gallery__stage");
  if (!galleryWrap || !gallery || !header) return;

  const navH =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--app-nav-h")
    ) || 0;
  const experienceH = window.innerHeight - navH;

  const galleryStyle = getComputedStyle(gallery);
  const cardGap =
    parseFloat(galleryStyle.getPropertyValue("--gallery-card-gap")) || 12;
  const stagePadTop = stage
    ? parseFloat(getComputedStyle(stage).paddingTop)
    : 0;
  const headerH = header.offsetHeight;
  const headerTargetTop = Math.round(
    Math.min(32, Math.max(16, experienceH * 0.024))
  );
  const cardsTopWhenPinned = headerTargetTop + headerH + stagePadTop;
  const maxPhotoH =
    experienceH - cardsTopWhenPinned - cardGap - 24;
  const photoH = Math.max(
    440,
    Math.min(Math.round(experienceH * 0.84), 900, Math.round(maxPhotoH))
  );
  page.style.setProperty("--gallery-photo-h", `${photoH}px`);
  page.style.setProperty("--gallery-pin-top", `${headerTargetTop}px`);

  const trackEndPx = measureGalleryTrackEnd(gallery);
  if (trackEndPx) {
    page.style.setProperty("--gallery-scroll-end", `${trackEndPx}px`);
  }

  markGalleryReady(page);
}

export function syncDesignerGalleryLayout(page?: HTMLElement | null) {
  const el =
    page ?? document.querySelector<HTMLElement>(".tower-3d-page");
  if (el) syncGalleryLayout(el);
}

export function ProductHorizontalGallery({
  productId = "designer",
}: {
  productId?: "designer" | "utility";
}) {
  const slides = getProductGallerySlides(productId);
  const scheduleLayoutRef = useRef<() => void>(() => {});
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".tower-3d-page");
    if (!page) return;

    const gallery = page.querySelector<HTMLElement>(".tower-3d__h-gallery");
    if (!gallery) return;

    const runLayout = () => {
      syncGalleryLayout(page);
      requestAnimationFrame(() => syncGalleryLayout(page));
      window.setTimeout(() => syncGalleryLayout(page), 120);
      window.setTimeout(() => syncGalleryLayout(page), 480);
    };
    scheduleLayoutRef.current = runLayout;
    runLayout();

    const links: HTMLLinkElement[] = [];
    for (const slide of slides) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = slide.imageUrl;
      document.head.appendChild(link);
      links.push(link);
    }

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => runLayout(), 200);
    };
    window.addEventListener("resize", onResize);

    const below = page.querySelector<HTMLElement>(".tower-3d__below-scroll");
    const belowRo =
      below &&
      new ResizeObserver(() => {
        runLayout();
      });
    if (below && belowRo) belowRo.observe(below);

    return () => {
      belowRo?.disconnect();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      page.style.removeProperty("--gallery-photo-h");
      page.style.removeProperty("--gallery-scroll-end");
      page.style.removeProperty("--gallery-pin-top");
      clearGalleryPinBand(page);
      for (const link of links) link.remove();
    };
  }, [slides]);

  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".tower-3d-page");
    if (!page) return;

    let raf = 0;
    const syncDots = () => {
      const progress = parseFloat(
        getComputedStyle(page).getPropertyValue("--gallery-progress")
      );
      const p = Number.isFinite(progress) ? progress : 0;
      const last = slides.length - 1;
      setActiveSlide(last > 0 ? Math.round(p * last) : 0);
      raf = requestAnimationFrame(syncDots);
    };

    raf = requestAnimationFrame(syncDots);
    return () => cancelAnimationFrame(raf);
  }, [slides]);

  const goToSlide = useCallback((index: number) => {
    const scrollRoot = getTowerScrollRoot();
    if (!scrollRoot) return;
    setDesignerGallerySlide(index, scrollRoot);
  }, []);

  const goNext = useCallback(() => {
    const scrollRoot = getTowerScrollRoot();
    if (!scrollRoot) return;
    advanceDesignerGallerySlide(1, scrollRoot);
  }, []);

  const goPrev = useCallback(() => {
    const scrollRoot = getTowerScrollRoot();
    if (!scrollRoot) return;
    advanceDesignerGallerySlide(-1, scrollRoot);
  }, []);

  const handleStageClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest("button")) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      if (x < rect.width * 0.35) {
        goPrev();
      } else {
        goNext();
      }
    },
    [goNext, goPrev]
  );

  const lastSlide = slides.length - 1;

  return (
    <div className="tower-3d__h-gallery-wrap tower-3d__designer-band tower-3d__designer-band--light">
      <section
        className="tower-3d__h-gallery"
        aria-label="Product gallery"
        aria-roledescription="carousel"
      >
        <header className="tower-3d__h-gallery__header">
          <div className="tower-3d__below-copy">
            <h2 className="tower-3d__below-title">In the field</h2>
            <p className="tower-3d__below-lede">
              Real Janta towers deployed and generating across working sites.
            </p>
          </div>
        </header>

        <div
          className="tower-3d__h-gallery__stage"
          onClick={handleStageClick}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              goNext();
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              goPrev();
            }
          }}
          role="group"
          aria-label="Gallery images. Click the right side for next, left for previous."
          tabIndex={0}
        >
          <div className="tower-3d__h-gallery__stage-inner">
            <div className="tower-3d__h-gallery__track">
              {slides.map((slide, index) => (
                <article key={slide.id} className="tower-3d__h-gallery__card">
                  <img
                    src={slide.imageUrl}
                    alt={slide.alt}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={index === 0 ? "high" : "auto"}
                    sizes="88vw"
                    draggable={false}
                    onLoad={() => scheduleLayoutRef.current()}
                    style={
                      slide.imageObjectPosition
                        ? { objectPosition: slide.imageObjectPosition }
                        : undefined
                    }
                  />
                </article>
              ))}
            </div>
          </div>

          <div className="tower-3d__h-gallery__nav" aria-hidden>
            <button
              type="button"
              className="tower-3d__h-gallery__nav-btn tower-3d__h-gallery__nav-btn--prev"
              onClick={(event) => {
                event.stopPropagation();
                goPrev();
              }}
              disabled={activeSlide <= 0}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              className="tower-3d__h-gallery__nav-btn tower-3d__h-gallery__nav-btn--next"
              onClick={(event) => {
                event.stopPropagation();
                goNext();
              }}
              disabled={activeSlide >= lastSlide}
              aria-label="Next image"
            >
              ›
            </button>
          </div>
        </div>

        <div
          className="tower-3d__h-gallery__dots"
          role="tablist"
          aria-label="Gallery position"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={
                index === activeSlide
                  ? "tower-3d__h-gallery__dot tower-3d__h-gallery__dot--active"
                  : "tower-3d__h-gallery__dot"
              }
              role="tab"
              aria-selected={index === activeSlide}
              aria-label={`Slide ${index + 1} of ${slides.length}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
