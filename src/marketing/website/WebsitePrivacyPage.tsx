import { WebsiteMarketingShell } from "./WebsiteMarketingShell";
import { useDocumentMeta } from "../../lib/useDocumentMeta";
import { openCookiePreferences } from "./WebsiteCookieConsent";
import { FOOTER_COPY } from "./websiteData";

const LAST_UPDATED = "July 2026";

export default function WebsitePrivacyPage() {
  useDocumentMeta({
    title: "Privacy Policy",
    description:
      "How Janta Power handles the information you share through our website contact form, and our cookieless approach to analytics.",
  });

  return (
    <WebsiteMarketingShell>
      <main className="web-simple-page web-legal" aria-labelledby="web-privacy-title">
        <header className="web-simple-page__intro">
          <p className="web-simple-page__eyebrow">Legal</p>
          <h1 id="web-privacy-title" className="web-simple-page__title">
            Privacy Policy
          </h1>
          <p className="web-simple-page__lede">
            We keep this short and honest. This explains what happens to the
            information you send us and how we treat cookies.
          </p>
          <p className="web-legal__updated">Last updated: {LAST_UPDATED}</p>
        </header>

        <div className="web-legal__body">
          <section aria-labelledby="web-privacy-collect">
            <h2 id="web-privacy-collect" className="web-legal__heading">
              What we collect
            </h2>
            <p>
              Only what you type into our contact form: your name, email, and
              message are always collected. On the contact page we also require
              project type. Optional details you may choose to add include
              company, phone, acreage, project size, and energy usage (only
              when applicable). We do not
              ask for or store anything else.
            </p>
          </section>

          <section aria-labelledby="web-privacy-use">
            <h2 id="web-privacy-use" className="web-legal__heading">
              How we use it
            </h2>
            <p>
              We use your details for one purpose: to read your inquiry and reply
              to it. We do not sell your information, and we do not use it for
              advertising.
            </p>
          </section>

          <section aria-labelledby="web-privacy-where">
            <h2 id="web-privacy-where" className="web-legal__heading">
              Where it goes
            </h2>
            <p>
              When you submit the form, your message is delivered to our{" "}
              {FOOTER_COPY.contactEmail} inbox and recorded in a private
              spreadsheet that only our team can access. To make this work we use
              two service providers strictly as processors: {""}
              <strong>Resend</strong> delivers the email, and{" "}
              <strong>Google Workspace</strong> holds the inbox and spreadsheet.
              Our website itself stores none of your submission.
            </p>
          </section>

          <section aria-labelledby="web-privacy-cookies">
            <h2 id="web-privacy-cookies" className="web-legal__heading">
              Cookies &amp; analytics
            </h2>
            <p>
              Our website sets no tracking or advertising cookies. We measure
              traffic with Cloudflare Web Analytics, which is anonymous and
              cookieless. We also use Cloudflare Turnstile on our form — a
              privacy-preserving check that confirms you are human and blocks
              spam, without profiling you. You can review or change your cookie
              choice at any time:
            </p>
            <p>
              <button
                type="button"
                className="web-legal__cookie-btn"
                onClick={openCookiePreferences}
              >
                Manage cookie preferences
              </button>
            </p>
          </section>

          <section aria-labelledby="web-privacy-retention">
            <h2 id="web-privacy-retention" className="web-legal__heading">
              Keeping and deleting your information
            </h2>
            <p>
              We keep inquiries only as long as needed to follow up and maintain
              our records. You can ask us to see or delete the information you
              sent at any time — just email {FOOTER_COPY.contactEmail} and we will
              take care of it.
            </p>
          </section>

          <section aria-labelledby="web-privacy-contact">
            <h2 id="web-privacy-contact" className="web-legal__heading">
              Contact
            </h2>
            <p>
              Questions about your privacy? Email us at{" "}
              <a href={`mailto:${FOOTER_COPY.contactEmail}`}>
                {FOOTER_COPY.contactEmail}
              </a>
              , or write to {FOOTER_COPY.location}.
            </p>
          </section>
        </div>
      </main>
    </WebsiteMarketingShell>
  );
}
