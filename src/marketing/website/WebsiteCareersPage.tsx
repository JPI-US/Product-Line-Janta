import { WebsiteFooter } from "./WebsiteFooter";
import { WebsiteMarketingShell } from "./WebsiteMarketingShell";
import { CAREERS_COPY } from "./websiteCareersData";
import { useDocumentMeta } from "../../lib/useDocumentMeta";

function CareersPicture({
  image,
  imageAvif,
  imageWebp,
  imageAlt,
  className,
}: {
  image: string;
  imageAvif: string;
  imageWebp: string;
  imageAlt: string;
  className?: string;
}) {
  return (
    <picture>
      <source srcSet={imageAvif} type="image/avif" />
      <source srcSet={imageWebp} type="image/webp" />
      <img className={className} src={image} alt={imageAlt} decoding="async" />
    </picture>
  );
}

export default function WebsiteCareersPage() {
  useDocumentMeta({
    title: "Careers",
    description:
      "Join Janta Power and help bring dense, dependable three-dimensional solar to the communities that need it most.",
  });
  const { hero, positions } = CAREERS_COPY;

  return (
    <WebsiteMarketingShell showFooter={false}>
      <main className="web-careers" aria-labelledby="web-careers-title">
        <header className="web-careers-hero">
          <div className="web-careers-hero__media" aria-hidden>
            <CareersPicture
              image={hero.image}
              imageAvif={hero.imageAvif}
              imageWebp={hero.imageWebp}
              imageAlt=""
              className="web-careers-hero__img"
            />
            <div className="web-careers-hero__scrim" />
          </div>
          <div className="web-careers-hero__inner">
            <div className="web-careers-hero__copy">
              <h1 id="web-careers-title" className="web-careers-hero__title">
                {hero.title}
              </h1>
              <p className="web-careers-hero__subtitle">{hero.subtitle}</p>
            </div>
          </div>
        </header>

        <div className="web-careers-sky">
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
                      <div className="web-careers-role__media">
                        <CareersPicture
                          image={role.image}
                          imageAvif={role.imageAvif}
                          imageWebp={role.imageWebp}
                          imageAlt={role.imageAlt}
                          className="web-careers-role__img"
                        />
                      </div>
                      <div className="web-careers-role__body">
                        <h3 className="web-careers-role__title">{role.title}</h3>
                        <ul className="web-careers-role__tags" aria-label="Role details">
                          {role.tags.map((tag) => (
                            <li key={tag} className="web-careers-role__tag">
                              {tag}
                            </li>
                          ))}
                        </ul>
                        <p className="web-careers-role__description">{role.description}</p>
                        <a
                          className="web-btn web-btn--gold web-careers-role__cta"
                          href={role.applyHref}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {role.applyLabel}
                        </a>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <WebsiteFooter />
        </div>
      </main>
    </WebsiteMarketingShell>
  );
}
