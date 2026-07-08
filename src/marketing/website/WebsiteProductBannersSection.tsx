import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { Picture } from "../../components/Picture";
import { SOLUTIONS_COPY } from "./websiteData";
import {
  solutionCardLabel,
  WebsiteSolutionCardName,
} from "./WebsiteSolutionCardName";

type ProductBannerCard = (typeof SOLUTIONS_COPY.cards)[number];

function ProductBanner({ card }: { card: ProductBannerCard }) {
  const mediaStyle = {
    "--web-product-banner-focus": card.imagePosition ?? "center",
  } as CSSProperties;

  return (
    <li className="web-product-banners__item">
      <Link
        className="web-product-banners__banner"
        to={card.href}
        aria-label={`${solutionCardLabel(card)} — ${card.hoverCta}`}
      >
        <div className="web-product-banners__copy">
          <h2 className="web-product-banners__title">
            <span className="web-product-banners__title-text">
              {card.bannerHeadline}
            </span>
            <span className="visually-hidden">
              <WebsiteSolutionCardName acronym={card.acronym} title={card.title} />
            </span>
          </h2>
          <div className="web-product-banners__lines">
            {card.bannerLines.map((line) => (
              <p key={line} className="web-product-banners__line">
                {line}
              </p>
            ))}
          </div>
          <span className="web-nav__cta web-product-banners__cta">{card.hoverCta}</span>
        </div>
        <div className="web-product-banners__media" style={mediaStyle} aria-hidden>
          <Picture
            className="web-product-banners__img"
            src={card.image}
            alt={card.imageAlt}
          />
        </div>
      </Link>
    </li>
  );
}

/** Stacked product promos — BMW-style split banners for DSR + LFM */
export function WebsiteProductBannersSection() {
  return (
    <section
      id="web-product-line"
      className="web-panel web-panel--product-banners"
      aria-labelledby="web-product-banners-title"
    >
      <h2 id="web-product-banners-title" className="visually-hidden">
        {SOLUTIONS_COPY.title}
      </h2>
      <ul className="web-product-banners__list">
        {SOLUTIONS_COPY.cards.map((card) => (
          <ProductBanner key={card.id} card={card} />
        ))}
      </ul>
    </section>
  );
}
