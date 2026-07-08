import { useEffect, useRef, type ReactNode } from "react";
import { WebsiteNav } from "./WebsiteNav";
import {
  isWebsiteHeroSkyPainted,
  subscribeWebsiteHeroSkyPainted,
} from "./websiteHeroSkyBoot";
import "./website.css";
import "./websiteReactBits.css";

type WebsiteMarketingShellProps = {
  /** Hub homepage — transparent nav over sky; scroll sync surfaces the bar */
  variant?: "hub-hero" | "standard";
  className?: string;
  children: ReactNode;
};

/** Shared marketing chrome — nav, fonts, and page shell across site routes */
export function WebsiteMarketingShell({
  variant = "standard",
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

    let unsubscribe: (() => void) | undefined;
    let safety = 0;

    if (variant !== "hub-hero") {
      dropBootHero();
    } else if (isWebsiteHeroSkyPainted()) {
      dropBootHero();
    } else {
      unsubscribe = subscribeWebsiteHeroSkyPainted(dropBootHero);
      safety = window.setTimeout(dropBootHero, 5000);
    }

    return () => {
      unsubscribe?.();
      if (safety) window.clearTimeout(safety);
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
    </div>
  );
}
