import { WebsiteFooter } from "./WebsiteFooter";
import { WebsiteMarketingShell } from "./WebsiteMarketingShell";
import { CAREERS_COPY } from "./websiteCareersData";

export default function WebsiteCareersPage() {
  const { hero, positions, values, mission } = CAREERS_COPY;

  return (
    <WebsiteMarketingShell>
      <main className="web-careers web-careers--soft-sky" aria-labelledby="web-careers-title">
        <header className="web-careers-hero">
          <div className="web-careers-hero__inner">
            <h1 id="web-careers-title" className="web-careers-hero__title">
              {hero.title}
            </h1>
            <p className="web-careers-hero__subtitle">{hero.subtitle}</p>
          </div>
        </header>

        <section
          className="web-careers-positions"
          aria-labelledby="web-careers-positions-title"
        >
          <div className="web-careers-positions__inner">
            <h2 id="web-careers-positions-title" className="web-careers-section-title">
              {positions.title}
            </h2>
            <ul className="web-careers-positions__list">
              {positions.items.map((role) => (
                <li key={role.id}>
                  <article className="web-careers-role">
                    <p className="web-careers-role__label">{role.label}</p>
                    <h3 className="web-careers-role__title">{role.title}</h3>
                    <p className="web-careers-role__location">{role.location}</p>
                    <a
                      className="web-btn web-btn--gold web-careers-role__cta"
                      href={role.applyHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {role.applyLabel}
                    </a>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="web-careers-values"
          aria-labelledby="web-careers-values-title"
        >
          <div className="web-careers-values__inner">
            <h2 id="web-careers-values-title" className="web-careers-section-title">
              {values.title}
            </h2>
            <ul className="web-careers-values__grid">
              {values.items.map((value, index) => (
                <li key={value.id} className="web-careers-values__item">
                  <span className="web-careers-values__index" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="web-careers-values__label">{value.title}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="web-careers-mission" aria-label="Our mission">
          <p className="web-careers-mission__text">{mission}</p>
        </section>
      </main>
      <WebsiteFooter />
    </WebsiteMarketingShell>
  );
}
