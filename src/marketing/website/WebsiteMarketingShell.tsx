import { useEffect, useRef, type ReactNode } from "react";
import { WebsiteFooter } from "./WebsiteFooter";
import { WebsiteNav } from "./WebsiteNav";

type WebsiteMarketingShellProps = {
  /** Hub homepage — transparent nav over sky; scroll sync surfaces the bar */
  variant?: "hub-hero" | "standard";
  /** Standard pages include the site footer unless disabled (e.g. product scroll pages). */
  showFooter?: boolean;
  className?: string;
  children: ReactNode;
};

/** Shared marketing chrome — nav, fonts, and page shell across site routes */
export function WebsiteMarketingShell({
  variant = "standard",
  showFooter = variant === "standard",
  className,
  children,
}: WebsiteMarketingShellProps) {
  const bodyActiveRef = useRef(false);

  useEffect(() => {
    document.body.classList.add("website-active");
    bodyActiveRef.current = true;

    const dropBootHero = () => {
      document.documentElement.classList.remove("web-boot-hero");
    };

    if (variant !== "hub-hero") {
      dropBootHero();
    } else {
      // New CSS hero sky — no WebGL sky paint gate
      dropBootHero();
    }

    return () => {
      if (bodyActiveRef.current) {
        document.body.classList.remove("website-active");
        bodyActiveRef.current = false;
      }
    };
  }, [variant]);

  const pageClass =
    variant === "hub-hero"
      ? "web-page web-page--hub-hero"
      : "web-page web-page--standard web-nav--surfaced";

  return (
    <div className={className ? `${pageClass} ${className}` : pageClass}>
      <WebsiteNav />
      {children}
      {showFooter ? <WebsiteFooter /> : null}
    </div>
  );
}
