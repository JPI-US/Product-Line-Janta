import { towers } from "../../data/towers";

const tower = towers.find((t) => t.id === "5kw")!;

export function ScrollStatsOverlay() {
  return (
    <div className="tower-3d__product-info">
      <p className="tower-3d__product-eyebrow">Janta Power</p>
      <h2 className="tower-3d__product-title">{tower.title}</h2>
      <p className="tower-3d__product-desc">{tower.description}</p>

      {tower.output ? (
        <div className="tower-3d__stats">
          <p className="tower-3d__stats-title">Typical yield band</p>
          <div className="tower-3d__stats-band" role="group">
            {[
              { k: "Daily", v: tower.output.dailyKwh },
              { k: "Monthly", v: tower.output.monthlyKwh },
              { k: "Annual", v: tower.output.annualKwh },
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
