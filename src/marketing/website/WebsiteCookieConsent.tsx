import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";

/**
 * Site-wide cookie consent (self-hosted vanilla-cookieconsent — bundled, never
 * loaded from a CDN). A bar across the top with Accept / Reject / Preferences.
 *
 * IMPORTANT — current state: the site sets NO non-essential cookies. Our only
 * analytics is Cloudflare Web Analytics, which is cookieless. So today the
 * "analytics" category below gates nothing; the bar exists to give visitors a
 * visible, honest choice and to be ready. The day a real tracker is added
 * (e.g. GA, a Calendly embed), load it only inside
 *   if (CookieConsent.acceptedCategory("analytics")) { ... }
 * and register it on the "cc:onConsent" / "cc:onChange" events so Reject keeps
 * it off. Nothing may set a non-essential cookie before consent.
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
            "We use only anonymous, cookieless analytics to understand site traffic — no tracking or advertising cookies. You can allow optional cookies below; they stay off unless you choose to enable them.",
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
                "Today Janta Power's website sets no tracking or advertising cookies, and our traffic analytics are anonymous and cookieless. These controls let you decide about any optional cookies we may add in the future — your choice is remembered and respected.",
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
                "Reserved for optional, privacy-respecting analytics. This currently sets no cookies; if enabled in the future it will only run with your consent.",
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
