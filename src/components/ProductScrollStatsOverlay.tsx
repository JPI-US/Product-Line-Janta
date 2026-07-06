import type { ProductId } from "../data/productPages";
import { getProductPage } from "../data/productPages";

export function ProductScrollStatsOverlay({
  productId,
  includeYieldBand = true,
}: {
  productId: ProductId;
  includeYieldBand?: boolean;
}) {
  const { tower: product } = getProductPage(productId);

  return (
    <div className="tower-3d__product-info">
      <p className="tower-3d__product-eyebrow">Janta Power</p>
      <h2 className="tower-3d__product-title">{product.title}</h2>
      <p className="tower-3d__product-desc">{product.description}</p>

      {includeYieldBand && product.output ? (
        <div className="tower-3d__stats">
          <p className="tower-3d__stats-title">Typical yield band</p>
          <div className="tower-3d__stats-band" role="group">
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
      ) : null}

      <button type="button" className="tower-3d__cta">
        SEE YOUR SAVINGS
      </button>
    </div>
  );
}
