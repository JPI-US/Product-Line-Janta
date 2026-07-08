import { WebsiteFooter } from "./WebsiteFooter";
import { WebsiteMarketingShell } from "./WebsiteMarketingShell";
import { WebsiteRootsFilmSection } from "./WebsiteRootsFilmSection";
import { ROOTS_COPY } from "./websiteRootsData";

type GalleryImage = (typeof ROOTS_COPY.gallery.images)[number];

function galleryTileClass(item: GalleryImage, isLastInColumn: boolean) {
  return [
    "web-roots-gallery__tile",
    `web-roots-gallery__tile--${item.fit}`,
    isLastInColumn ? "web-roots-gallery__tile--fill" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function WebsiteRootsPage() {
  const { hero, beginnings, gallery, founder, gambia, film, cta } = ROOTS_COPY;
  const imageById = new Map(gallery.images.map((item) => [item.id, item]));

  return (
    <WebsiteMarketingShell>
      <main className="web-roots web-roots--soft-sky" aria-labelledby="web-roots-title">
        <header className="web-roots-hero">
          <div className="web-roots-hero__media" aria-hidden>
            <img
              className="web-roots-hero__img"
              src={hero.image}
              alt=""
              decoding="async"
              loading="eager"
            />
            <div className="web-roots-hero__scrim" />
          </div>
          <div className="web-roots-hero__inner">
            <p className="web-roots-hero__eyebrow">{hero.title}</p>
            <h1 id="web-roots-title" className="web-roots-hero__tagline">
              {hero.tagline[0]}
              <br />
              {hero.tagline[1]}
            </h1>
          </div>
        </header>

        <section className="web-roots-beginnings" aria-labelledby="web-roots-beginnings-title">
          <div className="web-roots-beginnings__inner">
            <div className="web-roots-beginnings__media">
              <img
                className="web-roots-beginnings__img"
                src={beginnings.image}
                alt={beginnings.imageAlt}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="web-roots-beginnings__copy">
              <h2 id="web-roots-beginnings-title">{beginnings.title}</h2>
              <p>{beginnings.body}</p>
            </div>
          </div>
        </section>

        <section className="web-roots-gallery" aria-label="Gambian culture and community">
          <div className="web-roots-gallery__mosaic">
              {gallery.columns.map((column, columnIndex) => (
                <div
                  key={columnIndex}
                  className="web-roots-gallery__column"
                  role="list"
                >
                  {column.map((imageId, imageIndex) => {
                    const item = imageById.get(imageId);
                    if (!item) return null;
                    const isLast = imageIndex === column.length - 1;
                    return (
                      <div
                        key={item.id}
                        className={galleryTileClass(item, isLast)}
                        role="listitem"
                      >
                        <img
                          src={item.src}
                          alt={item.alt}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        </section>

        <section className="web-roots-story" aria-labelledby="web-roots-gambia-title">
          <div className="web-roots-story__inner">
            <article className="web-roots-story__block">
              <h2 id="web-roots-gambia-title">{gambia.title}</h2>
              <p>{gambia.body}</p>
            </article>
          </div>
        </section>

        <section className="web-roots-founder" aria-label="Founder message">
          <div className="web-roots-founder__inner">
            <img
              className="web-roots-founder__portrait"
              src={founder.image}
              alt={founder.imageAlt}
              loading="lazy"
              decoding="async"
            />
            <figure className="web-roots-founder__quote">
              <blockquote>&ldquo;{founder.quote}&rdquo;</blockquote>
              <figcaption>
                <cite>{founder.name}</cite>
                <span>{founder.role}</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <WebsiteRootsFilmSection film={film} />

        <div className="web-roots-closing">
          <section className="web-roots-spotlight" aria-labelledby="web-roots-spotlight-title">
            <div className="web-roots-spotlight__inner">
              <div className="web-roots-spotlight__copy">
                <h2 id="web-roots-spotlight-title">{gambia.spotlight.title}</h2>
                <p>{gambia.spotlight.body}</p>
              </div>
              <img
                className="web-roots-spotlight__img"
                src={gambia.spotlight.image}
                alt={gambia.spotlight.imageAlt}
                loading="lazy"
                decoding="async"
              />
            </div>
          </section>

          <section className="web-roots-cta" aria-labelledby="web-roots-cta-title">
            <div className="web-roots-cta__row">
              <img
                className="web-roots-cta__img"
                src={cta.image}
                alt={cta.imageAlt}
                loading="lazy"
                decoding="async"
              />
              <div className="web-roots-cta__copy">
                <h2 id="web-roots-cta-title">{cta.title}</h2>
                <p className="web-roots-cta__body">{cta.body}</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <WebsiteFooter />
    </WebsiteMarketingShell>
  );
}
