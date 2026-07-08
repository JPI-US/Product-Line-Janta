import { WebsitePictureCardGlow } from "./WebsitePictureCardGlow";
import { VALUE_COPY } from "./websiteData";

/** Core value props — centered headline, image + stacked feature rows */
export function WebsiteValueSection() {
  return (
    <section
      id="web-value"
      className="web-panel web-panel--value"
      aria-labelledby="web-value-title"
    >
      <div className="web-panel__content web-value">
        <header className="web-value__header">
          <h2 id="web-value-title" className="web-value__title">
            {VALUE_COPY.title}{" "}
            <span className="web-value__title-accent">{VALUE_COPY.titleEmphasis}</span>
          </h2>
        </header>

        <div className="web-value__body">
          <figure className="web-value__figure">
            <WebsitePictureCardGlow className="web-rb-border-glow--value">
              <div className="web-value__img-shell">
                <img
                  className="web-value__img"
                  src={VALUE_COPY.image}
                  alt={VALUE_COPY.imageAlt}
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: VALUE_COPY.imagePosition }}
                />
                <div className="web-value__img-tone" aria-hidden />
              </div>
            </WebsitePictureCardGlow>
          </figure>

          <ul className="web-value__rows">
            {VALUE_COPY.items.map((item) => (
              <li key={item.id} className="web-value__row">
                <div className="web-value__row-copy">
                  <h3 className="web-value__row-title">{item.title}</h3>
                  <p className="web-value__row-detail">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
