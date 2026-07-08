import { getProductPage } from "../data/productPages";
import type { TowerOutput } from "../data/towers";
import { halveTowerOutput } from "../lib/towerOutputScale";

const PERIODS = [
  { label: "Daily", key: "dailyKwh" as const },
  { label: "Monthly", key: "monthlyKwh" as const },
  { label: "Annual", key: "annualKwh" as const },
];

const JANTA_NOTES = {
  designer: "Azimuthal tracking solar tower",
  utility: "Azimuthal tracking LFM Tower",
} as const;

function YieldValue({ value }: { value: string }) {
  return (
    <span className="tower-3d__yield-matrix__value">
      {value}
      <span className="tower-3d__yield-matrix__unit"> kWh</span>
    </span>
  );
}

function YieldMatrix({
  janta,
  traditional,
  jantaNote,
}: {
  janta: TowerOutput;
  traditional: TowerOutput;
  jantaNote: string;
}) {
  const rows = [
    {
      id: "traditional",
      name: "Fixed solar",
      note: "Traditional fixed-tilt",
      output: traditional,
    },
    {
      id: "janta",
      name: "Janta",
      note: jantaNote,
      output: janta,
      badge: "50% more yield",
    },
  ] as const;

  return (
    <div className="tower-3d__yield-matrix">
      <div
        className="tower-3d__yield-matrix__table"
        role="table"
        aria-label="Typical yield band comparison"
      >
        <div
          className="tower-3d__yield-matrix__row tower-3d__yield-matrix__row--head"
          role="row"
        >
          <span className="tower-3d__yield-matrix__system" role="columnheader" />
          {PERIODS.map((period) => (
            <span
              key={period.key}
              className="tower-3d__yield-matrix__period"
              role="columnheader"
            >
              {period.label}
            </span>
          ))}
        </div>

        {rows.map((row) => (
          <div
            key={row.id}
            className={`tower-3d__yield-matrix__row tower-3d__yield-matrix__row--${row.id}`}
            role="row"
          >
            <div className="tower-3d__yield-matrix__system" role="rowheader">
              <span className="tower-3d__yield-matrix__name">{row.name}</span>
              <span className="tower-3d__yield-matrix__note">{row.note}</span>
              {"badge" in row && row.badge ? (
                <span className="tower-3d__yield-matrix__badge">{row.badge}</span>
              ) : null}
            </div>
            {PERIODS.map((period) => (
              <div
                key={period.key}
                className="tower-3d__yield-matrix__cell"
                role="cell"
              >
                <span className="tower-3d__yield-matrix__cell-label">
                  {period.label}
                </span>
                <YieldValue value={row.output[period.key]} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Fixed solar vs Janta yield comparison */
export function ProductYieldSection({
  productId,
}: {
  productId: "designer" | "utility";
}) {
  const output = getProductPage(productId).tower.output;
  if (!output) return null;

  const traditional = halveTowerOutput(output);

  return (
    <section
      className="tower-3d__yield-section tower-3d__designer-band"
      aria-labelledby={`tower-yield-title-${productId}`}
    >
      <div className="tower-3d__yield-section__inner">
        <header className="tower-3d__yield-section__header">
          <h2 id={`tower-yield-title-${productId}`} className="tower-3d__below-title">
            Fixed solar vs Janta
          </h2>
          <p className="tower-3d__yield-section__lede">
            Typical yield band for a comparable site footprint.
          </p>
        </header>

        <YieldMatrix
          janta={output}
          traditional={traditional}
          jantaNote={JANTA_NOTES[productId]}
        />
      </div>
    </section>
  );
}
