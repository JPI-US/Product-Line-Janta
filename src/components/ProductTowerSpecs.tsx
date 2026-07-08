import { useEffect, useRef, type CSSProperties } from "react";
import type { ProductId } from "../data/productPages";
import { designerTowerSpecs } from "../data/designerTowerSpecs";
import { utilityTowerSpecs } from "../data/utilityTowerSpecs";

function SpecIcon({ id }: { id: string }) {
  switch (id) {
    case "wind":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path
            d="M4 8h11a3 3 0 1 0-2.82-4M4 16h13a3 3 0 1 1-2.82 4M6 12h15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "snow":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path
            d="M12 3v18M5.6 6.4l12.8 11.2M18.4 6.4 5.6 17.6M3 12h18M6.4 18.4 17.6 5.6M17.6 18.4 6.4 5.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "power":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path
            d="M13 2 5 14h6l-1 8 9-14h-6l1-6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "solar":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect
            x="3"
            y="6"
            width="18"
            height="12"
            rx="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M3 12h18M9 6v12M15 6v12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
      );
    default:
      return null;
  }
}

const SPECS_BY_PRODUCT = {
  designer: designerTowerSpecs,
  utility: utilityTowerSpecs,
} as const;

export function ProductTowerSpecs({ productId }: { productId: ProductId }) {
  const sectionRef = useRef<HTMLElement>(null);
  const specs = SPECS_BY_PRODUCT[productId];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      section.classList.add("tower-3d__specs-section--visible");
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("tower-3d__specs-section--visible");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    io.observe(section);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="tower-3d__specs-section tower-3d__designer-band tower-3d__designer-band--wash"
      aria-label="Tower specifications"
    >
      <header className="tower-3d__specs-header">
        <div className="tower-3d__below-copy">
          <h2 className="tower-3d__below-title">Built for real-world sites</h2>
          <p className="tower-3d__specs-lead">
            Structural ratings and power flexibility at a glance.
          </p>
        </div>
      </header>

      <ul className="tower-3d__specs-grid">
        {specs.map((spec, index) => (
          <li
            key={spec.id}
            className="tower-3d__specs-card web-value__row"
            data-spec-id={spec.id}
            style={{ "--spec-i": index } as CSSProperties}
          >
            <span className="tower-3d__specs-card__icon" aria-hidden>
              <SpecIcon id={spec.id} />
            </span>
            <div className="web-value__row-copy">
              <h3 className="tower-3d__specs-card__title web-value__row-title">
                {spec.title}
              </h3>
              <p className="tower-3d__specs-card__value">
                <span className="tower-3d__specs-card__number">{spec.value}</span>
                {spec.unit ? (
                  <span className="tower-3d__specs-card__unit">{spec.unit}</span>
                ) : null}
              </p>
              <p className="tower-3d__specs-card__detail web-value__row-detail">
                {spec.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
