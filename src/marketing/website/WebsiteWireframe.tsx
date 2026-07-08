import type { ReactNode } from "react";
import type { WireframeBlock, WireframeSection } from "./websiteWireframeData";
import { LANDING_WIREFRAME_SECTIONS } from "./websiteWireframeData";

function WireTag({ children }: { children: ReactNode }) {
  return <span className="web-wire__tag">{children}</span>;
}

function WireBlock({ block }: { block: WireframeBlock }) {
  return (
    <div className="web-wire__block">
      <span className="web-wire__block-label">{block.label}</span>
      {block.hint ? <span className="web-wire__block-hint">{block.hint}</span> : null}
    </div>
  );
}

function WireSectionHeader({ section }: { section: WireframeSection }) {
  return (
    <header className="web-wire__header">
      <span className="web-wire__index">{String(section.index).padStart(2, "0")}</span>
      <div className="web-wire__header-copy">
        <WireTag>{section.eyebrow}</WireTag>
        <h2 className="web-wire__title">{section.title}</h2>
        <p className="web-wire__layout">{section.layout}</p>
      </div>
    </header>
  );
}

function GalleryWire({ section }: { section: WireframeSection }) {
  return (
    <section id={`web-wire-${section.id}`} className="web-panel web-panel--wire web-panel--wire-gallery">
      <div className="web-panel__content">
        <WireSectionHeader section={section} />
        <div className="web-wire__gallery">
          <div className="web-wire__gallery-track">
            {section.blocks.map((block) => (
              <figure key={block.id} className="web-wire__gallery-card">
                <WireBlock block={block} />
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustWire({ section }: { section: WireframeSection }) {
  return (
    <section id={`web-wire-${section.id}`} className="web-panel web-panel--wire web-panel--wire-trust">
      <div className="web-panel__content web-panel__content--center">
        <WireSectionHeader section={section} />
        <WireBlock block={section.blocks[0]!} />
        <WireBlock block={section.blocks[1]!} />
      </div>
    </section>
  );
}

function CtaWire({ section }: { section: WireframeSection }) {
  return (
    <section id={`web-wire-${section.id}`} className="web-panel web-panel--wire web-panel--wire-cta">
      <div className="web-panel__content web-panel__content--center">
        <WireSectionHeader section={section} />
        <WireBlock block={section.blocks[0]!} />
        <div className="web-wire__cta-row">
          <WireBlock block={section.blocks[1]!} />
          <WireBlock block={section.blocks[2]!} />
        </div>
      </div>
    </section>
  );
}

function FooterWire({ section }: { section: WireframeSection }) {
  return (
    <section id={`web-wire-${section.id}`} className="web-panel web-panel--wire web-panel--wire-footer">
      <div className="web-panel__content">
        <WireSectionHeader section={section} />
        <div className="web-wire__footer-grid">
          <WireBlock block={section.blocks[0]!} />
          <WireBlock block={section.blocks[1]!} />
        </div>
        <WireBlock block={section.blocks[2]!} />
      </div>
    </section>
  );
}

const byId = Object.fromEntries(LANDING_WIREFRAME_SECTIONS.map((s) => [s.id, s])) as Record<
  string,
  WireframeSection
>;

/** Scrollable low-fidelity wireframe for post–product-line landing sections */
export function WebsiteLandingWireframe() {
  return (
    <div className="web-wire" aria-label="Landing page wireframe">
      <GalleryWire section={byId.gallery!} />
      <TrustWire section={byId.trust!} />
      <CtaWire section={byId.cta!} />
      <FooterWire section={byId.footer!} />
    </div>
  );
}
