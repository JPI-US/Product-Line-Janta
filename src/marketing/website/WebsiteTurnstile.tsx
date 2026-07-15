import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile widget — privacy-preserving bot check that produces a
 * one-time token the server verifies. Turnstile's api.js is the one permitted
 * third-party script on the site: it is essential bot protection from our own
 * infra provider, not an analytics/marketing tracker, and sets no ad cookies.
 *
 * The site key is public and safe to ship in the bundle. In production it comes
 * from VITE_TURNSTILE_SITE_KEY (a build-time var — set it in Cloudflare Pages
 * before the build). Locally it falls back to Cloudflare's always-pass test key.
 */
const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TEST_SITE_KEY = "1x00000000000000000000AA";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile failed to load"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function getTurnstileSiteKey(): string {
  return (
    import.meta.env.VITE_TURNSTILE_SITE_KEY ||
    (import.meta.env.DEV ? TEST_SITE_KEY : "")
  );
}

export function WebsiteTurnstile({
  onToken,
  resetSignal,
}: {
  onToken: (token: string | null) => void;
  /** Increment to force a fresh token after a submit (tokens are single-use). */
  resetSignal: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  const siteKey = getTurnstileSiteKey();

  useEffect(() => {
    if (!siteKey || !hostRef.current) return;
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !hostRef.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(hostRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => onTokenRef.current(null));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* widget already gone */
        }
        widgetId.current = null;
      }
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetSignal > 0 && widgetId.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetId.current);
      } catch {
        /* nothing to reset */
      }
      onTokenRef.current(null);
    }
  }, [resetSignal]);

  if (!siteKey) return null;
  return <div ref={hostRef} className="web-footer__turnstile" />;
}
