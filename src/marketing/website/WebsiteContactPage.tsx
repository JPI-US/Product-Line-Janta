import { WebsiteContactForm } from "./WebsiteContactForm";
import { WebsiteMarketingShell } from "./WebsiteMarketingShell";

export default function WebsiteContactPage() {
  return (
    <WebsiteMarketingShell>
      <main className="web-simple-page web-simple-page--contact" aria-labelledby="web-contact-title">
        <p className="web-simple-page__eyebrow">Get in touch</p>
        <h1 id="web-contact-title" className="web-simple-page__title">
          Contact
        </h1>
        <div className="web-simple-page__form">
          <WebsiteContactForm showTitle={false} />
        </div>
      </main>
    </WebsiteMarketingShell>
  );
}
