import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";

/** Zaraz purpose id for the Analytics purpose (Cloudflare → Zaraz → Consent). */
const ZARAZ_ANALYTICS_PURPOSE = "YWGh";

declare global {
  interface Window {
    zaraz?: {
      consent?: {
        APIReady?: boolean;
        set?: (purposes: Record<string, boolean>) => void;
        sendQueuedEvents?: () => void;
      };
    };
  }
}

/**
 * Mirrors this banner's "analytics" category into Zaraz, which gates GA4.
 * Zaraz's own consent modal is disabled so this bar is the single source of
 * truth; without this bridge Zaraz never learns the visitor's choice.
 */
function syncZarazConsent() {
  const granted = CookieConsent.acceptedCategory("analytics");
  const apply = () => {
    try {
      window.zaraz?.consent?.set?.({ [ZARAZ_ANALYTICS_PURPOSE]: granted });
      if (granted) window.zaraz?.consent?.sendQueuedEvents?.();
    } catch (err) {
      console.error("zaraz consent sync failed", err);
    }
  };
  // Zaraz may not have loaded yet on a first paint.
  if (window.zaraz?.consent?.APIReady) apply();
  else document.addEventListener("zarazConsentAPIReady", apply, { once: true });
}

/**
 * Site-wide cookie consent (self-hosted vanilla-cookieconsent — bundled, never
 * loaded from a CDN). A bar across the top with Accept / Reject / Preferences.
 *
 * IMPORTANT — current state: the "analytics" category gates Google Analytics 4,
 * which Zaraz sends server-side. Verified on the live site: the only cookies
 * present are cc_cookie (this banner's own record) and zaraz-consent — GA4 sets
 * no _ga/_ga_* cookies here. Consent still matters, because server-side GA4
 * ships visitor data to Google whether or not a cookie is involved.
 * Zaraz's own consent modal is switched off, so this bar is the single source of
 * truth and syncZarazConsent() below is what actually grants or withholds
 * consent. Any future tracker must be gated the same way — either behind the
 * Zaraz Analytics purpose, or behind
 *   if (CookieConsent.acceptedCategory("analytics")) { ... }
 * registered on onConsent / onChange so Reject keeps it off. Nothing may set a
 * non-essential cookie before consent. If GA4 is ever switched to client-side
 * gtag it will start setting _ga cookies and the copy below goes stale again —
 * re-check document.cookie before trusting it.
 */
const COOKIE_CONFIG: CookieConsent.CookieConsentConfig = {
  guiOptions: {
    consentModal: {
      layout: "bar",
      position: "bottom",
      equalWeightButtons: true,
    },
    preferencesModal: { layout: "box" },
  },
  onConsent: syncZarazConsent,
  onChange: syncZarazConsent,
  categories: {
    necessary: { enabled: true, readOnly: true },
    analytics: { enabled: false },
  },
  language: {
    default: "en",
    translations: {
      en: {
        consentModal: {
          title: "We value your privacy",
          description:
            "We use Google Analytics to understand how visitors use our site. It sets no cookies on your device and stays off unless you enable it below.",
          acceptAllBtn: "Accept",
          acceptNecessaryBtn: "Reject",
          showPreferencesBtn: "Preferences",
        },
        preferencesModal: {
          title: "Cookie preferences",
          acceptAllBtn: "Accept all",
          acceptNecessaryBtn: "Reject all",
          savePreferencesBtn: "Save preferences",
          closeIconLabel: "Close",
          sections: [
            {
              title: "How we use cookies",
              description:
                "Janta Power's website sets no tracking or advertising cookies — the only cookies we set remember your cookie choice. We use Google Analytics to understand how visitors use the site; it runs only if you enable it here, and in our setup it sets no cookies on your device.",
            },
            {
              title: "Strictly necessary",
              description:
                "Required for the site to function and to remember your cookie choice. These are always on and cannot be switched off.",
              linkedCategory: "necessary",
            },
            {
              title: "Analytics (optional)",
              description:
                "Google Analytics, used to understand how visitors use jantaus.com. Runs only with your consent and sets no cookies on your device.",
              linkedCategory: "analytics",
            },
          ],
        },
      },
    },
  },
};

export function WebsiteCookieConsent() {
  useEffect(() => {
    // A consent-init failure must never take down the page, so guard it.
    try {
      void CookieConsent.run(COOKIE_CONFIG);
    } catch (err) {
      console.error("cookie consent init failed", err);
    }
  }, []);

  return null;
}

/** Re-open the preferences dialog (wired to the footer / privacy page link). */
export function openCookiePreferences() {
  try {
    CookieConsent.showPreferences();
  } catch {
    /* consent not initialised yet */
  }
}
