import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { lazy, Suspense } from "react";
import { WebsitePictureCardGlow } from "./WebsitePictureCardGlow";
import { WebsiteStatGrid } from "./WebsiteStatGrid";
import {
  solutionCardLabel,
  WebsiteSolutionCardName,
} from "./WebsiteSolutionCardName";
import {
  BENEFITS_COPY,
  SOLUTIONS_COPY,
} from "./websiteData";
import { WEBSITE_REACT_BITS } from "./websiteReactBitsConfig";
import { useReactBitActive } from "./useWebsiteReducedMotion";

const Iridescence = lazy(() => import("./react-bits/Iridescence/Iridescence"));

type SolutionCard = (typeof SOLUTIONS_COPY.cards)[number];

function SolutionCardLink({ card }: { card: SolutionCard }) {
  return (
    <Link
      className="web-solutions__card"
      to={card.href}
      aria-label={`${solutionCardLabel(card)}, ${card.hoverCta}`}
    >
      <img
        className="web-solutions__card-img"
        src={card.image}
        alt={card.imageAlt}
        loading="lazy"
        decoding="async"
      />
      <div className="web-solutions__card-scrim" aria-hidden />
      <div className="web-solutions__card-copy">
        <h3 className="web-solutions__card-title">
          <WebsiteSolutionCardName acronym={card.acronym} title={card.title} />
        </h3>
      </div>
      <ul className="web-solutions__card-tags" aria-label={`${solutionCardLabel(card)} highlights`}>
        {card.tags.map((tag) => (
          <li key={tag}>
            <span className="web-solutions__card-tag">{tag}</span>
          </li>
        ))}
      </ul>
      <span className="web-solutions__card-cta">
        {card.hoverCta} <span aria-hidden>→</span>
      </span>
    </Link>
  );
}

export function WebsiteBenefitsSection() {
  const iridescenceActive = useReactBitActive("benefitsIridescence");
  const iridCfg = WEBSITE_REACT_BITS.benefitsIridescence;

  return (
    <section
      id="web-benefits"
      className="web-panel web-panel--benefits"
      aria-labelledby="web-benefits-title"
    >
      {iridescenceActive ? (
        <div
          className="web-rb-bg-layer web-rb-bg-layer--benefits"
          aria-hidden
          style={
            {
              "--web-rb-iridescence-opacity": iridCfg.opacity,
            } as CSSProperties
          }
        >
          <Suspense fallback={null}>
            <Iridescence
              color={iridCfg.color}
              speed={iridCfg.speed}
              amplitude={iridCfg.amplitude}
              mouseReact={false}
            />
          </Suspense>
        </div>
      ) : null}
      <div className="web-panel__content web-benefits">
        <h2 id="web-benefits-title" className="web-benefits__title">
          {BENEFITS_COPY.title}{" "}
          <span className="web-benefits__title-accent">{BENEFITS_COPY.titleEmphasis}</span>
        </h2>
        <WebsiteStatGrid items={BENEFITS_COPY.items} className="web-benefits__grid" />
      </div>
    </section>
  );
}

export function WebsiteSolutionsSection() {
  return (
    <section
      id="web-product-line"
      className="web-panel web-panel--solutions web-panel--soft-sky"
      aria-labelledby="web-solutions-title"
    >
      <div className="web-panel__content">
        <div className="web-solutions__header">
          <h2 id="web-solutions-title" className="web-solutions__title">
            {SOLUTIONS_COPY.title}
          </h2>
        </div>
        <ul className="web-solutions__grid">
          {SOLUTIONS_COPY.cards.map((card) => (
            <li key={card.id}>
              <WebsitePictureCardGlow className="web-rb-border-glow--solutions">
                <SolutionCardLink card={card} />
              </WebsitePictureCardGlow>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
