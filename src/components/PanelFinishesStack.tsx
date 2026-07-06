import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { PanelDesignImage } from "./PanelDesignImage";
import { sidePanelDesigns } from "../data/sidePanelDesigns";

const PANEL_COUNT = sidePanelDesigns.length;
const MARQUEE_DURATION_S = 48;

/** Duplicated for seamless infinite loop */
const marqueePanels = [...sidePanelDesigns, ...sidePanelDesigns];

function wrapOffset(offset: number, loopWidth: number): number {
  if (loopWidth <= 0) return offset;
  let x = offset;
  while (x <= -loopWidth) x += loopWidth;
  while (x > 0) x -= loopWidth;
  return x;
}

export function PanelFinishesStack() {
  const regionId = useId();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const loopWidthRef = useRef(0);
  const rafRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const visibleRef = useRef(true);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const paint = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
  }, []);

  const measureLoop = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.children.length < PANEL_COUNT + 1) return;

    const first = track.children[0] as HTMLElement;
    const loopStart = track.children[PANEL_COUNT] as HTMLElement;
    const newLoop = loopStart.offsetLeft - first.offsetLeft;
    if (newLoop <= 0) return;

    const prevLoop = loopWidthRef.current;
    if (prevLoop > 0 && Math.abs(prevLoop - newLoop) > 0.5) {
      offsetRef.current = wrapOffset(
        (offsetRef.current / prevLoop) * newLoop,
        newLoop
      );
    } else {
      offsetRef.current = wrapOffset(offsetRef.current, newLoop);
    }

    loopWidthRef.current = newLoop;
    paint();
  }, [paint]);

  const selectOnHover = useCallback((index: number) => {
    setActiveIndex(index % PANEL_COUNT);
  }, []);

  const onDeckMouseLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  useEffect(() => {
    measureLoop();
    const track = trackRef.current;
    if (!track) return;

    const ro = new ResizeObserver(() => measureLoop());
    ro.observe(track);

    const imgs = track.querySelectorAll("img");
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener("load", measureLoop, { once: true });
    });

    return () => ro.disconnect();
  }, [measureLoop]);

  useEffect(() => {
    const stopLoop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };

    const tick = (time: number) => {
      const animate = visibleRef.current;
      if (lastTimeRef.current != null && animate) {
        const dt = (time - lastTimeRef.current) / 1000;
        const loop = loopWidthRef.current;
        if (loop > 0) {
          const speed = loop / MARQUEE_DURATION_S;
          offsetRef.current -= speed * dt;
          offsetRef.current = wrapOffset(offsetRef.current, loop);
          paint();
        }
      }
      lastTimeRef.current = time;
      if (visibleRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
      }
    };

    const startLoop = () => {
      if (rafRef.current) return;
      lastTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    };

    const scroller = scrollerRef.current;
    if (!scroller) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) startLoop();
        else stopLoop();
      },
      { root: null, rootMargin: "12% 0px", threshold: 0 }
    );
    io.observe(scroller);
    startLoop();

    return () => {
      io.disconnect();
      stopLoop();
    };
  }, [paint]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveIndex((current) => {
        if (current === null) return PANEL_COUNT - 1;
        return (current - 1 + PANEL_COUNT) % PANEL_COUNT;
      });
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveIndex((current) => {
        if (current === null) return 0;
        return (current + 1) % PANEL_COUNT;
      });
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(PANEL_COUNT - 1);
    }
  };

  const ariaStatus =
    activeIndex === null
      ? `No finish selected, ${PANEL_COUNT} options`
      : `Side panel finish options, ${activeIndex + 1} of ${PANEL_COUNT}`;

  return (
    <div className="panel-deck" onMouseLeave={onDeckMouseLeave}>
      <div
        ref={scrollerRef}
        className="panel-deck__scroller"
        role="region"
        aria-roledescription="carousel"
        aria-labelledby={`${regionId}-label`}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <p id={`${regionId}-label`} className="visually-hidden">
          {ariaStatus}
        </p>

        <div
          ref={trackRef}
          className="panel-deck__track"
          role="listbox"
          aria-label="Panel finishes"
        >
          {marqueePanels.map((panel, index) => {
            const logicalIndex = index % PANEL_COUNT;
            const isActive =
              activeIndex !== null && logicalIndex === activeIndex;

            return (
              <button
                key={`${panel.id}-${index}`}
                type="button"
                className={[
                  "panel-deck__card",
                  isActive ? "panel-deck__card--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={
                  {
                    "--card-tint-a": panel.theme.tintA,
                    "--card-tint-b": panel.theme.tintB,
                    "--card-accent": panel.theme.accent,
                    "--card-spine": panel.theme.spine,
                    zIndex: isActive ? 2 : 1,
                  } as CSSProperties
                }
                onMouseEnter={() => selectOnHover(logicalIndex)}
                onFocus={() => selectOnHover(logicalIndex)}
                aria-label={`${panel.title}${isActive ? ", selected" : ""}`}
                aria-current={isActive ? "true" : undefined}
                aria-hidden={index >= PANEL_COUNT ? true : undefined}
                role="option"
                aria-selected={isActive}
              >
                <span className="panel-deck__card-frame">
                  <span className="panel-deck__card-wash" aria-hidden />
                  <PanelDesignImage
                    svgUrl={panel.svgUrl}
                    pngUrl={panel.pngUrl}
                    alt=""
                    displayScale={panel.deckScale}
                  />
                </span>
                <span className="panel-deck__card-label">{panel.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
