import type { ProductId } from "../data/productPages";
import { getProductPage } from "../data/productPages";

export function ProductYieldBandSection({
  productId,
}: {
  productId: ProductId;
}) {
  const { tower: product } = getProductPage(productId);
  if (!product.output) return null;

  return (
    <section
      className="tower-3d__yield-section tower-3d__soft-panel-bg"
      aria-labelledby="tower-yield-title"
    >
      <div className="tower-3d__yield-section__inner">
        <header className="tower-3d__yield-section__header">
          <p className="tower-3d__below-eyebrow">Performance</p>
          <h2 id="tower-yield-title" className="tower-3d__below-title">
            Typical yield band
          </h2>
        </header>

        <div className="tower-3d__stats tower-3d__stats--section">
          <div className="tower-3d__stats-band" role="group" aria-label="Yield estimates">
            {[
              { k: "Daily", v: product.output.dailyKwh },
              { k: "Monthly", v: product.output.monthlyKwh },
              { k: "Annual", v: product.output.annualKwh },
            ].map((row) => (
              <div key={row.k} className="tower-3d__stats-cell">
                <span className="tower-3d__stats-k">{row.k}</span>
                <span className="tower-3d__stats-v">
                  <span className="tower-3d__stats-value-line">
                    {row.v}
                    <span className="tower-3d__stats-unit">
                      {"\u00A0"}
                      kWh
                    </span>
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
