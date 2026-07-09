import { Link } from "react-router-dom";
import { WebsiteContactForm } from "./WebsiteContactForm";
import { WebsiteMarketingShell } from "./WebsiteMarketingShell";
import { CONTACT_PAGE_COPY, FOOTER_COPY } from "./websiteData";
import { useDocumentMeta } from "../../lib/useDocumentMeta";

export default function WebsiteContactPage() {
  useDocumentMeta({
    title: "Contact",
    description:
      "Get in touch with Janta Power about three-dimensional solar for your project — or take the savings quiz to estimate land use and lifetime savings.",
  });

  return (
    <WebsiteMarketingShell>
      <main className="web-contact-page" aria-labelledby="web-contact-title">
        <header className="web-contact-page__intro">
          <p className="web-simple-page__eyebrow">{CONTACT_PAGE_COPY.eyebrow}</p>
          <h1 id="web-contact-title" className="web-simple-page__title">
            {CONTACT_PAGE_COPY.title}
          </h1>
          <p className="web-simple-page__lede">{CONTACT_PAGE_COPY.lede}</p>
        </header>

        <div className="web-contact-page__grid">
          <section className="web-contact-page__panel" aria-labelledby="web-contact-form-title">
            <h2 id="web-contact-form-title" className="web-contact-page__panel-title">
              Send a message
            </h2>
            <WebsiteContactForm showTitle={false} labelledBy="web-contact-form-title" />
            <div className="web-contact-page__details">
              <a href={`mailto:${FOOTER_COPY.contactEmail}`}>{FOOTER_COPY.contactEmail}</a>
              <a href={`tel:${FOOTER_COPY.contactPhoneTel}`}>{FOOTER_COPY.contactPhone}</a>
              <span>{FOOTER_COPY.location}</span>
            </div>
          </section>

          <aside
            id="savings-quiz"
            className="web-contact-page__quiz"
            aria-labelledby="web-contact-quiz-title"
          >
            <p className="web-contact-page__quiz-eyebrow">{CONTACT_PAGE_COPY.quizEyebrow}</p>
            <h2 id="web-contact-quiz-title" className="web-contact-page__quiz-title">
              {CONTACT_PAGE_COPY.quizTitle}
            </h2>
            <p className="web-contact-page__quiz-body">{CONTACT_PAGE_COPY.quizBody}</p>
            <Link to={CONTACT_PAGE_COPY.quizHref} className="web-contact-page__quiz-cta">
              {CONTACT_PAGE_COPY.quizCta}
              <span aria-hidden> →</span>
            </Link>
          </aside>
        </div>
      </main>
    </WebsiteMarketingShell>
  );
}
