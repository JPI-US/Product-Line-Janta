import { useCallback, useEffect, useRef } from "react";
import { PanelDesignImage } from "./PanelDesignImage";
import { sidePanelDesigns } from "../data/sidePanelDesigns";

const MARQUEE_DURATION_S = 50;
const MARQUEE_FRAME_MS = 1000 / 30;
/** Pause autoscroll only while the 3D hero still owns the viewport */
const MARQUEE_HERO_PAGE_SCROLL_MAX = 0.3;
const PANEL_COUNT = sidePanelDesigns.length;

/** Duplicated for seamless loop */
const marqueePanels = [...sidePanelDesigns, ...sidePanelDesigns];

function wrapOffset(offset: number, loopWidth: number): number {
  if (loopWidth <= 0) return offset;
  let x = offset;
  while (x <= -loopWidth) x += loopWidth;
  while (x > 0) x -= loopWidth;
  return x;
}

export function PanelFinishesMarquee() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const loopWidthRef = useRef(0);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const rafRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const lastPaintMsRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const visibleRef = useRef(true);

  const paint = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
  }, []);

  const measureLoop = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const items = track.querySelectorAll<HTMLElement>(".tower-3d__panel-item");
    if (items.length < PANEL_COUNT) return;
    let width = 0;
    for (let i = 0; i < PANEL_COUNT; i++) {
      const el = items[i];
      if (!el) continue;
      const style = getComputedStyle(el);
      const ml = parseFloat(style.marginLeft);
      const mr = parseFloat(style.marginRight);
      width +=
        el.offsetWidth +
        (Number.isFinite(ml) ? ml : 0) +
        (Number.isFinite(mr) ? mr : 0);
    }
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    loopWidthRef.current = width + gap * Math.max(0, PANEL_COUNT - 1);
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const scroller = scrollerRef.current;
    if (!scroller) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          lastTimeRef.current = performance.now();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(scroller);

    const ro = new ResizeObserver(() => {
      measureLoop();
      paint();
    });
    ro.observe(scroller);
    if (trackRef.current) ro.observe(trackRef.current);

    measureLoop();
    paint();

    const imgs = trackRef.current?.querySelectorAll<HTMLImageElement>(
      ".tower-3d__panel-img"
    );
    const onImgReady = () => {
      measureLoop();
      paint();
    };
    imgs?.forEach((img) => {
      if (img.complete) onImgReady();
      else img.addEventListener("load", onImgReady);
    });

    return () => {
      io.disconnect();
      ro.disconnect();
      imgs?.forEach((img) => img.removeEventListener("load", onImgReady));
    };
  }, [measureLoop, paint]);

  useEffect(() => {
    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (
        !visibleRef.current ||
        draggingRef.current ||
        reducedMotionRef.current
      ) {
        lastTimeRef.current = now;
        return;
      }

      const page = document.querySelector<HTMLElement>(".tower-3d-page");
      if (page) {
        const pageScroll = parseFloat(
          getComputedStyle(page).getPropertyValue("--page-scroll") || "0"
        );
        if (pageScroll < MARQUEE_HERO_PAGE_SCROLL_MAX) {
          lastTimeRef.current = now;
          return;
        }
      }

      const loop = loopWidthRef.current;
      if (loop <= 0) return;

      const prev = lastTimeRef.current ?? now;
      lastTimeRef.current = now;
      const dt = (now - prev) / 1000;
      const speed = loop / MARQUEE_DURATION_S;
      offsetRef.current = wrapOffset(offsetRef.current - speed * dt, loop);

      if (now - lastPaintMsRef.current < MARQUEE_FRAME_MS) return;
      lastPaintMsRef.current = now;
      paint();
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [paint]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const setDraggingUi = (active: boolean) => {
      draggingRef.current = active;
      scroller.classList.toggle("tower-3d__panels-scroller--dragging", active);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      setDraggingUi(true);
      dragStartXRef.current = event.clientX;
      dragStartOffsetRef.current = offsetRef.current;
      scroller.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const delta = event.clientX - dragStartXRef.current;
      const loop = loopWidthRef.current;
      offsetRef.current = wrapOffset(dragStartOffsetRef.current + delta, loop);
      paint();
    };

    const stopDrag = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      if (scroller.hasPointerCapture(event.pointerId)) {
        scroller.releasePointerCapture(event.pointerId);
      }
      setDraggingUi(false);
      lastTimeRef.current = performance.now();
      paint();
    };

    scroller.addEventListener("pointerdown", onPointerDown);
    scroller.addEventListener("pointermove", onPointerMove);
    scroller.addEventListener("pointerup", stopDrag);
    scroller.addEventListener("pointercancel", stopDrag);

    return () => {
      scroller.removeEventListener("pointerdown", onPointerDown);
      scroller.removeEventListener("pointermove", onPointerMove);
      scroller.removeEventListener("pointerup", stopDrag);
      scroller.removeEventListener("pointercancel", stopDrag);
    };
  }, [paint]);

  return (
    <div ref={scrollerRef} className="tower-3d__panels-scroller">
      <ul
        ref={trackRef}
        className="tower-3d__panels-track"
        aria-label="Side panel designs"
      >
        {marqueePanels.map((panel, index) => (
          <li
            key={`${panel.id}-${index}`}
            className="tower-3d__panel-item"
            aria-hidden={index >= PANEL_COUNT ? true : undefined}
          >
            <PanelDesignImage
              svgUrl={panel.svgUrl}
              pngUrl={panel.pngUrl}
              alt=""
              displayScale={panel.deckScale}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
