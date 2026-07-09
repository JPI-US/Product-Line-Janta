import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { NAV_COPY } from "./websiteData";
import { WebsiteNavLogo } from "./WebsiteNavLogo";
import { WebsiteFlowingMenuOverlay } from "./WebsiteFlowingMenuOverlay";
import { useReactBitActive } from "./useWebsiteReducedMotion";

export function WebsiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const flowingMenuActive = useReactBitActive("flowingMenu");

  useEffect(() => {
    document.body.classList.toggle("web-nav-mobile-open", mobileOpen);
    document.querySelector(".web-page")?.classList.toggle(
      "web-rb-flowing-menu-active",
      mobileOpen && flowingMenuActive,
    );
    return () => {
      document.body.classList.remove("web-nav-mobile-open");
      document.querySelector(".web-page")?.classList.remove("web-rb-flowing-menu-active");
    };
  }, [mobileOpen, flowingMenuActive]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="web-nav" role="banner">
      <div className="web-nav__inner">
        <Link
          to={NAV_COPY.brandHref}
          className="web-nav__brand"
          aria-label={NAV_COPY.brandAria}
          onClick={closeMobile}
        >
          <WebsiteNavLogo />
        </Link>

        <button
          type="button"
          className="web-nav__menu-toggle"
          aria-expanded={mobileOpen}
          aria-controls="web-nav-menu"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span className="web-nav__visually-hidden">
            {mobileOpen ? "Close menu" : "Open menu"}
          </span>
          <span className="web-nav__menu-bars" aria-hidden>
            <span />
            <span />
          </span>
        </button>

        <nav
          id="web-nav-menu"
          className="web-nav__menu"
          aria-label="Primary"
          data-open={mobileOpen || undefined}
        >
          <Link
            to={NAV_COPY.ctaHref}
            className="web-nav__cta web-nav__cta--menu"
            onClick={closeMobile}
          >
            {NAV_COPY.cta}
            <span className="web-nav__cta-arrow" aria-hidden>
              →
            </span>
          </Link>
        </nav>

        <Link to={NAV_COPY.ctaHref} className="web-nav__cta web-nav__cta--bar">
          {NAV_COPY.cta}
          <span className="web-nav__cta-arrow" aria-hidden>
            →
          </span>
        </Link>
      </div>

      {flowingMenuActive ? (
        <WebsiteFlowingMenuOverlay open={mobileOpen} onNavigate={closeMobile} />
      ) : null}
    </header>
  );
}
