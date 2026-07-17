import { WebsiteContactForm } from "./WebsiteContactForm";
import { WebsiteMarketingShell } from "./WebsiteMarketingShell";
import { CONTACT_PAGE_COPY } from "./websiteData";
import { useDocumentMeta } from "../../lib/useDocumentMeta";

export default function WebsiteContactPage() {
  useDocumentMeta({
    title: "Contact",
    description:
      "Fill out the form below or schedule a consultation with Janta Power.",
  });

  return (
    <WebsiteMarketingShell>
      <main className="web-contact-page" aria-labelledby="web-contact-title">
        <div className="web-contact-page__stack">
          <section className="web-contact-page__panel" aria-labelledby="web-contact-title">
            <header className="web-contact-page__form-head">
              <h1 id="web-contact-title" className="web-contact-page__title">
                {CONTACT_PAGE_COPY.title}
              </h1>
              <p className="web-contact-page__lede">
                {CONTACT_PAGE_COPY.ledeBefore}
                <a
                  className="web-contact-page__schedule-link"
                  href={CONTACT_PAGE_COPY.consultHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {CONTACT_PAGE_COPY.scheduleLinkLabel}
                  <span aria-hidden> →</span>
                </a>
              </p>
            </header>

            <WebsiteContactForm
              showTitle={false}
              labelledBy="web-contact-title"
              extended
              layout="hero"
              ctaLabel={CONTACT_PAGE_COPY.formCta}
            />
          </section>
        </div>
      </main>
    </WebsiteMarketingShell>
  );
}
