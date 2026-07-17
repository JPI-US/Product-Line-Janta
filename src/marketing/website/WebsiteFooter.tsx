import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { lazy, Suspense } from "react";
import { FOOTER_COPY } from "./websiteData";
import { SHOW_QUIZ } from "../../config/featureFlags";
import { WEBSITE_REACT_BITS } from "./websiteReactBitsConfig";
import { useReactBitActive } from "./useWebsiteReducedMotion";
import { openCookiePreferences } from "./WebsiteCookieConsent";

const Aurora = lazy(() => import("./react-bits/Aurora/Aurora"));

function FooterSocialIcon({ id }: { id: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    focusable: false as const,
  };

  if (id === "linkedin") {
    return (
      <svg {...common}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    );
  }
  if (id === "instagram") {
    return (
      <svg {...common}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }
  if (id === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        />
      </svg>
    );
  }
  return null;
}

function FooterLink({
  href,
  label,
  external,
  withArrow,
}: {
  href: string;
  label: string;
  external?: boolean;
  withArrow?: boolean;
}) {
  const className = withArrow ? "web-footer__link web-footer__link--arrow" : "web-footer__link";
  const content = (
    <>
      {label}
      {withArrow ? (
        <span className="web-footer__link-arrow" aria-hidden>
          →
        </span>
      ) : null}
    </>
  );

  if (external || href.startsWith("http") || href.startsWith("mailto:")) {
    return (
      <a
        href={href}
        className={className}
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {content}
    </Link>
  );
}

export function WebsiteFooter() {
  const auroraActive = useReactBitActive("footerAurora");
  const auroraCfg = WEBSITE_REACT_BITS.footerAurora;

  return (
    <footer className="web-footer web-footer--soft-sky" role="contentinfo">
      {auroraActive ? (
        <div
          className="web-rb-bg-layer web-rb-bg-layer--footer"
          aria-hidden
          style={{ "--web-rb-aurora-opacity": auroraCfg.opacity } as CSSProperties}
        >
          <Suspense fallback={null}>
            <Aurora
              colorStops={[...auroraCfg.colorStops]}
              amplitude={auroraCfg.amplitude}
              blend={auroraCfg.blend}
            />
          </Suspense>
        </div>
      ) : null}
      <div className="web-footer__main">
        <div className="web-footer__col web-footer__col--brand" aria-labelledby="web-footer-brand-title">
          <h2 id="web-footer-brand-title" className="web-footer__heading">
            <Link to="/" className="web-footer__brand-home">
              {FOOTER_COPY.brand}
            </Link>
          </h2>
          <ul className="web-footer__list">
            <li>
              <a className="web-footer__link" href={`mailto:${FOOTER_COPY.contactEmail}`}>
                {FOOTER_COPY.contactEmail}
              </a>
            </li>
            <li>
              <a className="web-footer__link" href={`tel:${FOOTER_COPY.contactPhoneTel}`}>
                {FOOTER_COPY.contactPhone}
              </a>
            </li>
            <li>
              <a
                className="web-footer__link"
                href={FOOTER_COPY.locationMapsHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                {FOOTER_COPY.location}
              </a>
            </li>
            <li>
              <ul className="web-footer__socials" aria-label="Social media">
                {FOOTER_COPY.socialLinks.map((social) => (
                  <li key={social.id}>
                    <a
                      className="web-footer__social"
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                    >
                      <FooterSocialIcon id={social.id} />
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </div>

        <nav className="web-footer__col web-footer__col--explore" aria-labelledby="web-footer-explore-title">
          <h2 id="web-footer-explore-title" className="web-footer__heading">
            {FOOTER_COPY.exploreTitle}
          </h2>
          <ul className="web-footer__list">
            {FOOTER_COPY.exploreLinks
              .filter((link) => SHOW_QUIZ || link.href !== "/quiz")
              .map((link) => (
                <li key={link.label}>
                  <FooterLink
                    href={link.href}
                    label={link.label}
                    withArrow={link.label === "Meet"}
                  />
                </li>
              ))}
          </ul>
        </nav>

        <nav className="web-footer__col web-footer__col--press" aria-labelledby="web-footer-press-title">
          <h2 id="web-footer-press-title" className="web-footer__heading">
            {FOOTER_COPY.pressTitle}
          </h2>
          <ul className="web-footer__list">
            {FOOTER_COPY.pressLinks.map((link) => (
              <li key={link.label}>
                <FooterLink href={link.href} label={link.label} external />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="web-footer__bar">
        <p className="web-footer__legal web-footer__legal--blurb">{FOOTER_COPY.blurb}</p>
        <div className="web-footer__legal-links">
          <Link to="/privacy" className="web-footer__link">
            Privacy Policy
          </Link>
          <button
            type="button"
            className="web-footer__link web-footer__link--button"
            onClick={openCookiePreferences}
          >
            Cookie Settings
          </button>
        </div>
        <p className="web-footer__legal web-footer__legal--copyright">{FOOTER_COPY.copyright}</p>
      </div>
    </footer>
  );
}
