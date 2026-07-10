import { Icon, SITES } from "../../components/globeSites";

/**
 * Static, three.js-free version of the "Janta in the world" section for phones.
 * The interactive WebGL globe (PremiumGlobe) would otherwise pull the ~350 KB
 * three bundle onto mobile; here we show a static earth image + the same
 * deployment cards so the content is intact with zero three.
 */
export function WebsiteGlobeMobile() {
  return (
    <section className="janta-globe-m" aria-label="Global deployments">
      <div className="janta-globe-m__header">
        <p className="janta-globe-m__eyebrow">Janta in the world</p>
        <h2 className="janta-globe-m__title">
          Powering the world, one tower at a time.
        </h2>
      </div>

      <div className="janta-globe-m__earth" aria-hidden>
        <img src="/earth.jpg" alt="" loading="lazy" decoding="async" />
        <span className="janta-globe-m__earth-glow" />
      </div>

      <ul className="janta-globe-m__sites" aria-label="Deployment sites">
        {SITES.map((site) => (
          <li key={site.name} className="janta-globe-m__site">
            <span className="janta-globe-m__site-icon">
              <Icon type={site.icon} />
            </span>
            <div className="janta-globe-m__site-body">
              <span className="janta-globe-m__site-loc">
                {site.name} · {site.country}
              </span>
              <span
                className="janta-globe-m__site-status"
                data-status={site.status}
              >
                {site.status}
              </span>
              <p className="janta-globe-m__site-text">{site.text}</p>
            </div>
          </li>
        ))}
      </ul>

      <style>{`
        .janta-globe-m {
          position: relative;
          color: var(--web-ink, #1a1a1f);
          padding: clamp(2rem, 5vh, 3rem) 1.25rem clamp(2.25rem, 5vh, 3.25rem);
          text-align: center;
        }
        .janta-globe-m__eyebrow {
          margin: 0 0 0.75rem;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #c8930a;
        }
        .janta-globe-m__title {
          margin: 0 auto 1.75rem;
          max-width: 18ch;
          font-size: clamp(1.5rem, 7vw, 2.1rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.12;
          color: var(--web-slate-ink, #1a2332);
        }
        .janta-globe-m__earth {
          position: relative;
          width: min(62vw, 260px);
          aspect-ratio: 1;
          margin: 0 auto 2rem;
        }
        .janta-globe-m__earth img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          box-shadow:
            inset -18px -12px 40px rgba(6, 24, 52, 0.55),
            0 18px 40px rgba(42, 96, 175, 0.22);
        }
        .janta-globe-m__earth-glow {
          position: absolute;
          inset: -8%;
          border-radius: 50%;
          background: radial-gradient(
            circle at 38% 34%,
            rgba(120, 180, 255, 0.28),
            transparent 62%
          );
          pointer-events: none;
        }
        .janta-globe-m__sites {
          list-style: none;
          margin: 0 auto;
          padding: 0;
          max-width: 460px;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          text-align: left;
        }
        .janta-globe-m__site {
          display: flex;
          gap: 0.8rem;
          padding: 0.9rem 1rem;
          border-radius: 14px;
          border: 1px solid rgba(30, 82, 158, 0.16);
          background: rgba(255, 255, 255, 0.72);
        }
        .janta-globe-m__site-icon {
          color: #c8930a;
          flex: none;
          margin-top: 0.1rem;
        }
        .janta-globe-m__site-body {
          min-width: 0;
        }
        .janta-globe-m__site-loc {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--web-brand-blue, #3a84dc);
          margin-bottom: 0.4rem;
        }
        .janta-globe-m__site-status {
          display: inline-block;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          border: 1px solid rgba(200, 147, 10, 0.5);
          color: #a6790a;
          background: rgba(200, 147, 10, 0.14);
          margin-bottom: 0.55rem;
        }
        .janta-globe-m__site-text {
          margin: 0;
          font-size: 0.86rem;
          line-height: 1.55;
          color: rgba(30, 30, 35, 0.72);
        }
      `}</style>
    </section>
  );
}
