import { utilityTowerSpecs } from "../../data/utilityTowerSpecs";

/** Subtle, condensed "Built for real-world sites" spec strip for the home page. */
export function WebsiteSpecsHighlight() {
  return (
    <section
      className="web-panel web-specs-lite"
      aria-labelledby="web-specs-lite-title"
    >
      <div className="web-panel__content web-specs-lite__inner">
        <header className="web-specs-lite__header">
          <h2 id="web-specs-lite-title" className="web-specs-lite__title">
            Built for real-world sites
          </h2>
          <p className="web-specs-lite__lead">
            Structural ratings and power flexibility at a glance.
          </p>
        </header>

        <ul className="web-specs-lite__grid">
          {utilityTowerSpecs.map((spec) => (
            <li key={spec.id} className="web-specs-lite__item">
              <span className="web-specs-lite__value">
                {spec.value}
                {spec.unit ? (
                  <span className="web-specs-lite__unit"> {spec.unit}</span>
                ) : null}
              </span>
              <span className="web-specs-lite__label">{spec.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
