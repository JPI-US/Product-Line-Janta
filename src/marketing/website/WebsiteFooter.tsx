import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { lazy, Suspense } from "react";
import { FOOTER_COPY } from "./websiteData";
import { SHOW_QUIZ } from "../../config/featureFlags";
import { WEBSITE_REACT_BITS } from "./websiteReactBitsConfig";
import { useReactBitActive } from "./useWebsiteReducedMotion";
import { WebsiteContactForm } from "./WebsiteContactForm";

const Aurora = lazy(() => import("./react-bits/Aurora/Aurora"));

function FooterLink({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  if (external || href.startsWith("http") || href.startsWith("mailto:")) {
    return (
      <a
        href={href}
        className="web-footer__link"
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {label}
      </a>
    );
  }

  return (
    <Link to={href} className="web-footer__link">
      {label}
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
        <div
          className="web-footer__col web-footer__col--contact"
          aria-labelledby="web-footer-contact-title"
        >
          <h2 id="web-footer-contact-title" className="web-footer__heading">
            {FOOTER_COPY.contactFormTitle}
          </h2>
          <WebsiteContactForm showTitle={false} labelledBy="web-footer-contact-title" />
        </div>

        <nav className="web-footer__col" aria-label={FOOTER_COPY.exploreTitle}>
          <h2 className="web-footer__heading">{FOOTER_COPY.exploreTitle}</h2>
          <ul className="web-footer__list">
            {FOOTER_COPY.exploreLinks
              .filter((link) => SHOW_QUIZ || link.href !== "/quiz")
              .map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href} label={link.label} />
                </li>
              ))}
          </ul>
        </nav>

        <nav className="web-footer__col" aria-label={FOOTER_COPY.pressTitle}>
          <h2 className="web-footer__heading">{FOOTER_COPY.pressTitle}</h2>
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
        <p className="web-footer__legal">{FOOTER_COPY.copyright}</p>
        <div className="web-footer__contact-details">
          <span className="web-footer__address">{FOOTER_COPY.location}</span>
          <a href={`mailto:${FOOTER_COPY.contactEmail}`}>{FOOTER_COPY.contactEmail}</a>
          <a href={`tel:${FOOTER_COPY.contactPhoneTel}`}>{FOOTER_COPY.contactPhone}</a>
        </div>
      </div>
    </footer>
  );
}
