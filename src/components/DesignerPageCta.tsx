import { Link } from "react-router-dom";

const CTA_IMAGE = "/towers/designer-cta-field.png";

export function DesignerPageCta() {
  return (
    <section
      className="tower-3d__designer-cta"
      aria-label="Get started with DSR Tower"
    >
      <div className="tower-3d__designer-cta__backdrop" aria-hidden>
        <img
          src={CTA_IMAGE}
          alt=""
          loading="lazy"
          decoding="async"
          sizes="100vw"
        />
      </div>

      <div className="tower-3d__designer-cta__scrim" aria-hidden />

      <div className="tower-3d__designer-cta__inner">
        <p className="tower-3d__designer-cta__eyebrow">DSR Tower</p>
        <h2 className="tower-3d__designer-cta__title">
          Ready for your next site?
        </h2>
        <p className="tower-3d__designer-cta__lead">
          Custom panels, field-proven performance, and a tower built for
          commercial campuses like this one.
        </p>
        <div className="tower-3d__designer-cta__actions">
          <Link to="/" className="tower-3d__designer-cta__btn">
            See your savings
            <span className="tower-3d__designer-cta__btn-arrow" aria-hidden>
              →
            </span>
          </Link>
          <Link
            to="/products/utility"
            className="tower-3d__designer-cta__btn tower-3d__designer-cta__btn--ghost"
          >
            Explore LFM Tower
          </Link>
        </div>
      </div>
    </section>
  );
}
