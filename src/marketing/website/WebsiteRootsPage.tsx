import { Link } from "react-router-dom";
import { WebsiteMarketingShell } from "./WebsiteMarketingShell";
import { WebsiteRootsFilmSection } from "./WebsiteRootsFilmSection";
import { ROOTS_COPY } from "./websiteRootsData";
import { useDocumentMeta } from "../../lib/useDocumentMeta";
import "./websiteRoots.css";

export default function WebsiteRootsPage() {
  useDocumentMeta({
    title: "Our Roots",
    description:
      "Born in Gambia, built for the world. How founder Mohammed Njie reimagined solar to bring reliable power to communities that need it most.",
  });
  const { hero, origin, stats, gallery, founder, firewood, film, impact, cta } =
    ROOTS_COPY;

  return (
    <WebsiteMarketingShell>
      <main className="rts" aria-labelledby="rts-hero-title">
        {/* Hero */}
        <header className="rts-hero">
          <img
            className="rts-hero__img"
            src={hero.image}
            alt={hero.imageAlt}
            decoding="async"
            loading="eager"
          />
          <div className="rts-hero__scrim" aria-hidden />
          <div className="rts-hero__inner">
            <p className="rts-hero__eyebrow">{hero.eyebrow}</p>
            <h1 id="rts-hero-title" className="rts-hero__title">
              {hero.tagline[0]}
              <br />
              {hero.tagline[1]}
            </h1>
          </div>
        </header>

        {/* Origin */}
        <section className="rts-origin">
          <div className="rts-narrow">
            <h2 className="rts-h2">{origin.title}</h2>
            <p className="rts-lead">{origin.body}</p>
          </div>
          <div className="rts-wide">
            <img
              className="rts-media"
              src={origin.image}
              alt={origin.imageAlt}
              loading="lazy"
              decoding="async"
            />
          </div>
        </section>

        {/* Stats */}
        <section className="rts-stats" aria-label="Janta by the numbers">
          <div className="rts-stats__row">
            {stats.map((s) => (
              <div key={s.l} className="rts-stat">
                <div className="rts-stat__n">{s.n}</div>
                <div className="rts-stat__l">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery */}
        <section className="rts-gallery" aria-labelledby="rts-gallery-title">
          <div className="rts-narrow">
            <h2 id="rts-gallery-title" className="rts-h2">
              {gallery.title}
            </h2>
            <p className="rts-lead">{gallery.body}</p>
          </div>
          <div className="rts-figs">
            {gallery.items.map((it) => (
              <figure key={it.cap} className="rts-fig">
                <img src={it.src} alt={it.cap} loading="lazy" decoding="async" />
                <figcaption>{it.cap}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Founder quote */}
        <section className="rts-founder" aria-label="Founder message">
          <img
            className="rts-founder__portrait"
            src={founder.image}
            alt={founder.imageAlt}
            loading="lazy"
            decoding="async"
          />
          <blockquote className="rts-founder__quote">
            &ldquo;{founder.quote}&rdquo;
          </blockquote>
          <p className="rts-founder__by">
            <span>{founder.name}</span> — {founder.role}
          </p>
        </section>

        {/* Firewood quote — full-bleed */}
        <section className="rts-firewood" aria-label="Voices from Tintinto">
          <img
            className="rts-firewood__img"
            src={firewood.poster}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
          />
          <div className="rts-firewood__scrim" aria-hidden />
          <div className="rts-firewood__inner">
            <p className="rts-firewood__quote">&ldquo;{firewood.quote}&rdquo;</p>
            <p className="rts-firewood__by">— {firewood.attribution}</p>
          </div>
        </section>

        {/* Film */}
        <WebsiteRootsFilmSection film={film} />

        {/* Impact */}
        <section
          id="roots-impact"
          className="rts-impact"
          aria-labelledby="rts-impact-title"
        >
          <div className="rts-narrow">
            <h2 id="rts-impact-title" className="rts-h2">
              {impact.title}
            </h2>
            <p className="rts-lead">{impact.body}</p>
          </div>
          <div className="rts-wide">
            <img
              className="rts-media"
              src={impact.image}
              alt={impact.imageAlt}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="rts-cols">
            {impact.columns.map((c) => (
              <div key={c.title} className="rts-col">
                <div className="rts-col__kicker">{c.kicker}</div>
                <h3 className="rts-col__title">{c.title}</h3>
                <p className="rts-col__body">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rts-cta" aria-labelledby="rts-cta-title">
          <div className="rts-narrow">
            <h2 id="rts-cta-title" className="rts-h2">
              {cta.title}
            </h2>
            <p className="rts-lead">{cta.body}</p>
            <div className="rts-cta__actions">
              <Link className="rts-btn rts-btn--primary" to={cta.primary.href}>
                {cta.primary.label}
              </Link>
              <a className="rts-btn rts-btn--ghost" href={cta.secondary.href}>
                {cta.secondary.label}
              </a>
            </div>
          </div>
        </section>
      </main>
    </WebsiteMarketingShell>
  );
}
