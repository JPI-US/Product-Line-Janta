import { Link } from "react-router-dom";
import { NAV_COPY } from "./websiteData";
import { WebsiteNavLogo } from "./WebsiteNavLogo";

/**
 * Site nav. The only nav action is "Contact", so there's no hamburger menu:
 * desktop shows the full CTA pill, phones show a compact contact icon that
 * links straight to /contact (no overlay, no collapsible menu).
 */
export function WebsiteNav() {
  return (
    <header className="web-nav" role="banner">
      <div className="web-nav__inner">
        <Link
          to={NAV_COPY.brandHref}
          className="web-nav__brand"
          aria-label={NAV_COPY.brandAria}
        >
          <WebsiteNavLogo />
        </Link>

        {/* Desktop: full CTA pill */}
        <Link to={NAV_COPY.ctaHref} className="web-nav__cta web-nav__cta--bar">
          {NAV_COPY.cta}
          <span className="web-nav__cta-arrow" aria-hidden>
            →
          </span>
        </Link>

        {/* Mobile: compact contact icon (replaces the single-item hamburger) */}
        <Link
          to={NAV_COPY.ctaHref}
          className="web-nav__contact-icon"
          aria-label={NAV_COPY.cta}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
