import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  WebsiteSolutionCardName,
} from "./WebsiteSolutionCardName";
import { NAV_COPY, SOLUTIONS_COPY } from "./websiteData";

type Props = {
  onNavigate?: () => void;
};

const MOBILE_NAV_MQ = "(max-width: 860px)";

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className="web-nav__chevron"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      style={{ transform: open ? "rotate(180deg)" : undefined }}
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function isMobileNav() {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_NAV_MQ).matches;
}

/** Tesla-style products menu — static pre-baked 3D stills only (no WebGL) */
export function WebsiteNavProductsDropdown({ onNavigate }: Props) {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const open = desktopOpen || mobileOpen;

  const clearCloseTimer = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const scheduleClose = () => {
    if (isMobileNav()) return;
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setDesktopOpen(false), 140);
  };

  const closeAll = () => {
    setDesktopOpen(false);
    setMobileOpen(false);
    onNavigate?.();
  };

  useEffect(() => {
    if (!desktopOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDesktopOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [desktopOpen]);

  useEffect(() => {
    if (!desktopOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setDesktopOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [desktopOpen]);

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <div
      ref={rootRef}
      className="web-nav__products"
      data-open={desktopOpen || undefined}
      onMouseEnter={() => {
        if (isMobileNav()) return;
        clearCloseTimer();
        setDesktopOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={`web-nav__link web-nav__products-trigger${open ? " web-nav__link--active" : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (isMobileNav()) {
            setMobileOpen((value) => !value);
            return;
          }
          setDesktopOpen((value) => !value);
        }}
      >
        {NAV_COPY.products}
        <ChevronDown open={open} />
      </button>

      {open ? (
        <div
          id={panelId}
          className="web-nav__products-mega"
          data-mobile-open={mobileOpen || undefined}
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
        >
          <div className="web-nav__products-mega-inner">
            {SOLUTIONS_COPY.cards.map((card) => (
              <article key={card.id} className="web-nav__product-card">
                <Link
                  to={card.href}
                  className="web-nav__product-hit"
                  onClick={closeAll}
                >
                  <span className="web-nav__product-visual">
                    <img
                      className="web-nav__product-img"
                      src={card.navImage}
                      alt={card.navRenderAlt}
                      width={400}
                      height={500}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <h3 className="web-nav__product-name">
                    <WebsiteSolutionCardName acronym={card.acronym} title={card.title} />
                  </h3>
                </Link>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
