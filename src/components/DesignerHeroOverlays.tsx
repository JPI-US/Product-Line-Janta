import { Link } from "react-router-dom";
import { getProductPage } from "../data/productPages";
import { DesignerConfigurator } from "./DesignerConfigurator";

/** DSR hero — centered title, then scroll crossfade to frosted intro + performance cards */
export function DesignerHeroOverlays() {
  const { tower: product } = getProductPage("designer");
  const output = product.output;

  return (
    <div className="tower-3d__designer-hero-ui">
      <header
        className="tower-3d__designer-hero-centered"
        aria-label={`${product.title} hero`}
      >
        <p className="tower-3d__hero-eyebrow">Janta Power</p>
        <h1 className="tower-3d__hero-title">{product.title}</h1>
      </header>

      <div className="tower-3d__designer-card-lane" aria-live="polite">
        {/* Card 1 — intro; visible while --info-reveal is 0 → ~0.55 */}
        <article
          className="tower-3d__dcard tower-3d__dcard--intro"
          aria-label={`${product.title} overview`}
        >
          <p className="tower-3d__dcard__eyebrow">{product.title}</p>
          <div className="tower-3d__dcard__stats-band tower-3d__dcard__stats-band--intro">
            <p className="tower-3d__dcard__body">{product.description}</p>
          </div>
        </article>

        {/* Card 2 — performance; fades in as --info-reveal passes ~0.5 */}
        {output ? (
          <article
            className="tower-3d__dcard tower-3d__dcard--perf"
            aria-labelledby="designer-hero-perf"
          >
            <p id="designer-hero-perf" className="tower-3d__dcard__eyebrow">
              Performance
            </p>
            <div
              className="tower-3d__dcard__stats-band"
              role="group"
              aria-label="Typical yield band"
            >
              {[
                { k: "Daily", v: output.dailyKwh },
                { k: "Monthly", v: output.monthlyKwh },
                { k: "Annual", v: output.annualKwh },
              ].map((row, i) => (
                <div
                  key={row.k}
                  className="tower-3d__dcard__stats-cell"
                  style={{ ["--stat-i" as string]: i }}
                >
                  <span className="tower-3d__dcard__stats-k">{row.k}</span>
                  <span className="tower-3d__dcard__stats-v">
                    <span className="tower-3d__dcard__stats-value-line">
                      {row.v}
                      <span className="tower-3d__dcard__stats-unit">
                        {"\u00A0"}
                        kWh
                      </span>
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <Link
              to="/orbit/designer"
              className="tower-3d__cta tower-3d__cta--ghost tower-3d__dcard__cta"
            >
              View in 360°
            </Link>
            <DesignerConfigurator />
          </article>
        ) : null}
      </div>
    </div>
  );
}
