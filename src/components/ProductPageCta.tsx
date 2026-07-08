import { Link } from "react-router-dom";
import type { ProductId } from "../data/productPages";

const CTA_BY_PRODUCT = {
  designer: {
    image: "/towers/designer-cta-field.png",
    eyebrow: "DSR Tower",
    title: "Ready for your next site?",
    lead:
      "Custom panels, field-proven performance, and a tower built for commercial campuses like this one.",
    primary: { label: "See your savings", href: "/quiz" },
    secondary: { label: "Explore LFM Tower", href: "/products/utility" },
  },
  utility: {
    image: "/marketing/lfm-tower.png",
    eyebrow: "LFM Tower",
    title: "Ready to deploy at scale?",
    lead:
      "Utility-scale output, field-ready installs, and a platform built for repeatable deployment.",
    primary: { label: "See your savings", href: "/quiz" },
    secondary: { label: "Explore DSR Tower", href: "/products/designer" },
  },
} as const;

export function ProductPageCta({ productId }: { productId: ProductId }) {
  const cta = CTA_BY_PRODUCT[productId];

  return (
    <section
      className="tower-3d__designer-cta"
      aria-label={`Get started with ${cta.eyebrow}`}
    >
      <div className="tower-3d__designer-cta__backdrop" aria-hidden>
        <img
          src={cta.image}
          alt=""
          loading="lazy"
          decoding="async"
          sizes="100vw"
        />
      </div>

      <div className="tower-3d__designer-cta__scrim" aria-hidden />

      <div className="tower-3d__designer-cta__inner">
        <p className="tower-3d__designer-cta__eyebrow">{cta.eyebrow}</p>
        <h2 className="tower-3d__designer-cta__title">{cta.title}</h2>
        <p className="tower-3d__designer-cta__lead">{cta.lead}</p>
        <div className="tower-3d__designer-cta__actions">
          <Link to={cta.primary.href} className="tower-3d__designer-cta__btn">
            {cta.primary.label}
            <span className="tower-3d__designer-cta__btn-arrow" aria-hidden>
              →
            </span>
          </Link>
          <Link
            to={cta.secondary.href}
            className="tower-3d__designer-cta__btn tower-3d__designer-cta__btn--ghost"
          >
            {cta.secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
