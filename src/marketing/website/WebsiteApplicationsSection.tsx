import { useEffect, useRef, useState } from "react";
import { WebsiteApplicationsAccordionPanel } from "./WebsiteApplicationsAccordionPanel";
import { APPLICATIONS_COPY } from "./websiteData";
import { useWebsiteReducedMotion } from "./useWebsiteReducedMotion";

type PanelId = (typeof APPLICATIONS_COPY.panels)[number]["id"];

const PANEL_RESIZE_MS = 400;

/**
 * True only where hover actually exists (mouse/trackpad). Touch screens fire
 * pointerenter on tap but never pointerleave — which is why a tapped panel used
 * to stay stuck open forever. On touch we drive the accordion by tap-to-toggle.
 */
function useHasHover(): boolean {
  const query = "(hover: hover) and (pointer: fine)";
  const [hasHover, setHasHover] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setHasHover(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return hasHover;
}

/** Where Janta Shines — image accordion panels */
export function WebsiteApplicationsSection() {
  const accordionRef = useRef<HTMLDivElement>(null);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeId, setActiveId] = useState<PanelId | null>(null);
  const [labelsReady, setLabelsReady] = useState(true);
  const reducedMotion = useWebsiteReducedMotion();
  const hasHover = useHasHover();

  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const accordion = accordionRef.current;
    if (!accordion) return;
    // Phones don't hover-preview panels, so don't eagerly pull all six full-size
    // photos down on a mobile connection — the <img>s are lazy and load on tap.
    if (!hasHover) return;

    let warmed = false;
    const warm = () => {
      if (warmed) return;
      warmed = true;
      for (const panel of APPLICATIONS_COPY.panels) {
        const img = new Image();
        img.decoding = "async";
        img.src = panel.image;
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) warm();
      },
      { rootMargin: "240px 0px", threshold: 0 },
    );
    observer.observe(accordion);
    return () => observer.disconnect();
  }, [hasHover]);

  const activatePanel = (id: PanelId) => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    setActiveId(id);
  };

  /** Tap/click/keyboard: same panel closes it, another one opens that instead. */
  const togglePanel = (id: PanelId) => {
    if (activeId === id) collapsePanels();
    else activatePanel(id);
  };

  const collapsePanels = () => {
    setActiveId(null);
    setLabelsReady(false);
    const delay = reducedMotion ? 0 : PANEL_RESIZE_MS;
    collapseTimerRef.current = setTimeout(() => {
      setLabelsReady(true);
      collapseTimerRef.current = null;
    }, delay);
  };

  const clearActiveUnlessMovingInside = (relatedTarget: EventTarget | null) => {
    if (relatedTarget && accordionRef.current?.contains(relatedTarget as Node)) return;
    collapsePanels();
  };

  return (
    <section
      id="web-applications"
      className="web-panel web-panel--applications"
      aria-labelledby="web-applications-title"
    >
      <div className="web-panel__content web-applications">
        <header className="web-applications__intro">
          <h2 id="web-applications-title" className="web-applications__title">
            {APPLICATIONS_COPY.title}{" "}
            <span
              className={
                reducedMotion
                  ? "web-applications__title-accent"
                  : "web-applications__title-accent web-applications__title-accent--live"
              }
            >
              {APPLICATIONS_COPY.titleAccent}
            </span>
          </h2>
          <p className="web-applications__description">{APPLICATIONS_COPY.description}</p>
        </header>

        <div
          ref={accordionRef}
          className="web-applications__accordion"
          onPointerLeave={
            hasHover
              ? (ev) => clearActiveUnlessMovingInside(ev.relatedTarget)
              : undefined
          }
        >
          <div
            className={`web-applications__accordion-panels${
              activeId ? " is-expanded" : ""
            }${labelsReady ? " labels-ready" : ""}`}
          >
            {APPLICATIONS_COPY.panels.map((panel) => (
              <WebsiteApplicationsAccordionPanel
                key={panel.id}
                id={panel.id}
                title={panel.title}
                body={panel.body}
                image={panel.image}
                imagePosition={panel.imagePosition}
                isActive={activeId === panel.id}
                hasHover={hasHover}
                onToggle={() => togglePanel(panel.id)}
                onActivate={() => activatePanel(panel.id)}
                onDeactivate={() => {
                  if (activeId === panel.id) collapsePanels();
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
