import { MEDIA_COPY } from "./websiteData";

/** Press coverage — publication logos + article headlines */
export function WebsiteMediaSection() {
  return (
    <section
      id="web-media"
      className="web-panel web-panel--media"
      aria-labelledby="web-media-title"
    >
      <div className="web-panel__content web-media">
        <header className="web-media__header">
          <h2 id="web-media-title" className="web-media__title">
            {MEDIA_COPY.title}
          </h2>
        </header>

        <ul className="web-media__grid">
          {MEDIA_COPY.articles.map((article) => (
            <li key={article.id}>
              <a
                className={`web-media__card web-media__card--${article.id}`}
                href={article.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div
                  className={`web-media__mark web-media__mark--${article.id}`}
                >
                  <img
                    src={article.logo}
                    alt={article.logoAlt}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <h3 className="web-media__headline">
                  <span className="web-media__headline-line">{article.headline[0]}</span>
                  <span className="web-media__headline-line">{article.headline[1]}</span>
                </h3>
                <span className="web-media__cta">
                  Read article
                  <span className="web-media__cta-arrow" aria-hidden>
                    →
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
