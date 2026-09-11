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
 * which is loaded through Cloudflare Zaraz and DOES set cookies (_ga, _ga_*).
 * Zaraz's own consent modal is switched off, so this bar is the single source of
 * truth and syncZarazConsent() below is what actually grants or withholds
 * consent. Any future tracker must be gated the same way — either behind the
 * Zaraz Analytics purpose, or behind
 *   if (CookieConsent.acceptedCategory("analytics")) { ... }
 * registered on onConsent / onChange so Reject keeps it off. Nothing may set a
 * non-essential cookie before consent, and the copy below must keep describing
 * what we actually load.
 */
const COOKIE_CONFIG: CookieConsent.CookieConsentConfig = {
  guiOptions: {
    consentModal: {
      layout: "bar",
      position: "top",
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
            "We use Google Analytics to understand how visitors use our site, which sets cookies. We set no advertising cookies. Analytics stays off unless you enable it below.",
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
                "Janta Power's website sets no advertising cookies. We use Google Analytics to understand how visitors use the site; it sets cookies and runs only if you enable it here. These controls let you decide — your choice is remembered and respected.",
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
                "Google Analytics, used to understand how visitors use jantaus.com. Sets cookies and only runs with your consent.",
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
