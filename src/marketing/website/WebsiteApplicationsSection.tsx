import { useEffect, useRef, useState } from "react";
import { WebsiteApplicationsAccordionPanel } from "./WebsiteApplicationsAccordionPanel";
import { APPLICATIONS_COPY } from "./websiteData";
import { useWebsiteReducedMotion } from "./useWebsiteReducedMotion";

type PanelId = (typeof APPLICATIONS_COPY.panels)[number]["id"];

const PANEL_RESIZE_MS = 400;

/** Where Janta Shines — image accordion panels */
export function WebsiteApplicationsSection() {
  const accordionRef = useRef<HTMLDivElement>(null);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeId, setActiveId] = useState<PanelId | null>(null);
  const [labelsReady, setLabelsReady] = useState(true);
  const reducedMotion = useWebsiteReducedMotion();

  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const accordion = accordionRef.current;
    if (!accordion) return;

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
  }, []);

  const activatePanel = (id: PanelId) => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    setActiveId(id);
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
          onPointerLeave={(ev) => clearActiveUnlessMovingInside(ev.relatedTarget)}
        >
          <div
            className={`web-applications__accordion-panels${
              activeId ? " is-expanded" : ""
            }${labelsReady ? " labels-ready" : ""}`}
            role="list"
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
