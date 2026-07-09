import { getProductPage } from "../data/productPages";
import type { TowerOutput } from "../data/towers";
import {
  YIELD_500KW_DALLAS,
  formatLandAcres,
  yield500kwMoreLabel,
  yield500kwOutput,
} from "../data/yieldComparison500kw";
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

export type YieldScenario = "product" | "500kw-dallas";

function YieldValue({ value, unit = "kWh" }: { value: string; unit?: string }) {
  return (
    <span className="tower-3d__yield-matrix__value">
      {value}
      <span className="tower-3d__yield-matrix__unit"> {unit}</span>
    </span>
  );
}

function YieldMatrix({
  janta,
  traditional,
  jantaNote,
  badge,
  tableLabel,
  land,
}: {
  janta: TowerOutput;
  traditional: TowerOutput;
  jantaNote: string;
  badge: string;
  tableLabel: string;
  land?: {
    janta: { value: string; unit: string };
    traditional: { value: string; unit: string };
  };
}) {
  const rows = [
    {
      id: "traditional",
      name: "Fixed solar",
      note: "Traditional fixed-tilt",
      output: traditional,
      land: land?.traditional,
    },
    {
      id: "janta",
      name: "Janta",
      note: jantaNote,
      output: janta,
      land: land?.janta,
      badge,
    },
  ] as const;

  return (
    <div className="tower-3d__yield-matrix">
      <div
        className={`tower-3d__yield-matrix__table${land ? " tower-3d__yield-matrix__table--with-land" : ""}`}
        role="table"
        aria-label={tableLabel}
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
          {land ? (
            <span className="tower-3d__yield-matrix__period" role="columnheader">
              Land
            </span>
          ) : null}
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
            {row.land ? (
              <div className="tower-3d__yield-matrix__cell" role="cell">
                <span className="tower-3d__yield-matrix__cell-label">Land</span>
                <YieldValue value={row.land.value} unit={row.land.unit} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Fixed solar vs Janta yield comparison */
export function ProductYieldSection({
  productId,
  scenario = "product",
}: {
  productId: "designer" | "utility";
  scenario?: YieldScenario;
}) {
  const sectionId = scenario === "500kw-dallas" ? "500kw-dallas" : productId;

  if (scenario === "500kw-dallas") {
    const janta = yield500kwOutput(YIELD_500KW_DALLAS.janta);
    const traditional = yield500kwOutput(YIELD_500KW_DALLAS.fixed);

    return (
      <section
        className="tower-3d__yield-section tower-3d__designer-band"
        aria-labelledby={`tower-yield-title-${sectionId}`}
      >
        <div className="tower-3d__yield-section__inner">
          <header className="tower-3d__yield-section__header">
            <h2 id={`tower-yield-title-${sectionId}`} className="tower-3d__below-title">
              Fixed solar vs Janta
            </h2>
            <p className="tower-3d__yield-section__lede">{YIELD_500KW_DALLAS.siteLabel}</p>
          </header>

          <YieldMatrix
            janta={janta}
            traditional={traditional}
            jantaNote="Azimuthal tracking solar tower"
            badge={yield500kwMoreLabel()}
            tableLabel={`${YIELD_500KW_DALLAS.siteLabel} yield comparison`}
            land={{
              janta: formatLandAcres(YIELD_500KW_DALLAS.janta.landAcres),
              traditional: formatLandAcres(YIELD_500KW_DALLAS.fixed.landAcres),
            }}
          />
        </div>
      </section>
    );
  }

  const output = getProductPage(productId).tower.output;
  if (!output) return null;

  const traditional = halveTowerOutput(output);

  return (
    <section
      className="tower-3d__yield-section tower-3d__designer-band"
      aria-labelledby={`tower-yield-title-${sectionId}`}
    >
      <div className="tower-3d__yield-section__inner">
        <header className="tower-3d__yield-section__header">
          <h2 id={`tower-yield-title-${sectionId}`} className="tower-3d__below-title">
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
          badge="50% more yield"
          tableLabel="Typical yield band comparison"
        />
      </div>
    </section>
  );
}
