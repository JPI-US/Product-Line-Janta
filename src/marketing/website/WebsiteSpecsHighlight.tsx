import { CountUp } from "../../components/CountUp";
import { utilityTowerSpecs } from "../../data/utilityTowerSpecs";
import { SPECS_LITE_COPY } from "./websiteData";

/** Built for real-world sites — photo + vertical spec datasheet. */
export function WebsiteSpecsHighlight() {
  const copy = SPECS_LITE_COPY;

  return (
    <section
      className="web-panel web-specs-lite"
      aria-labelledby="web-specs-lite-title"
    >
      <div className="web-panel__content web-specs-lite__inner">
        <header className="web-specs-lite__header">
          <h2 id="web-specs-lite-title" className="web-specs-lite__title">
            {copy.title}
          </h2>
          <p className="web-specs-lite__lead">{copy.lead}</p>
        </header>

        <div className="web-specs-lite__layout">
          <figure className="web-specs-lite__photo">
            <img
              className="web-specs-lite__photo-img"
              src={copy.image}
              alt={copy.imageAlt}
              loading="lazy"
              decoding="async"
              style={{ objectPosition: copy.imagePosition }}
            />
          </figure>

          <div className="web-specs-lite__panel">
            <ul className="web-specs-lite__specs">
              {utilityTowerSpecs.map((spec) => (
                <li key={spec.id} className="web-specs-lite__spec">
                  <span className="web-specs-lite__value">
                    <CountUp value={spec.value} />
                    {spec.unit ? (
                      <span className="web-specs-lite__unit"> {spec.unit}</span>
                    ) : null}
                  </span>
                  <span className="web-specs-lite__label">{spec.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
