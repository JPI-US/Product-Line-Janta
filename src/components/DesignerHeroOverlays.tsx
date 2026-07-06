import { getProductPage } from "../data/productPages";

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
        <p className="tower-3d__hero-hint">Scroll to learn more.</p>
      </header>

      <div className="tower-3d__designer-hero-cards" aria-hidden={undefined}>
        <article
          className="tower-3d__designer-glass tower-3d__designer-glass--intro"
          aria-label={`${product.title} overview`}
        >
          <p className="tower-3d__designer-glass__eyebrow">Janta Power</p>
          <h2 className="tower-3d__designer-glass__title">{product.title}</h2>
          <p className="tower-3d__designer-glass__body">{product.description}</p>
        </article>

        {output ? (
          <article
            className="tower-3d__designer-glass tower-3d__designer-glass--perf"
            aria-labelledby="designer-hero-perf"
          >
            <h2 id="designer-hero-perf" className="tower-3d__designer-glass__perf-title">
              Performance
            </h2>
            <div
              className="tower-3d__designer-perf-stats"
              role="group"
              aria-label="Typical yield band"
            >
              {[
                { k: "Daily", v: output.dailyKwh },
                { k: "Monthly", v: output.monthlyKwh },
                { k: "Annual", v: output.annualKwh },
              ].map((row) => (
                <div key={row.k} className="tower-3d__designer-perf-stat">
                  <span className="tower-3d__designer-perf-stat__value">
                    {row.v}
                    <span className="tower-3d__designer-perf-stat__unit"> kWh</span>
                  </span>
                  <span className="tower-3d__designer-perf-stat__label">{row.k}</span>
                </div>
              ))}
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
