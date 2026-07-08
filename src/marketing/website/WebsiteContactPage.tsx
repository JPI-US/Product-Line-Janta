import { WebsiteContactForm } from "./WebsiteContactForm";
import { WebsiteMarketingShell } from "./WebsiteMarketingShell";
import { useDocumentMeta } from "../../lib/useDocumentMeta";

export default function WebsiteContactPage() {
  useDocumentMeta({
    title: "Contact",
    description:
      "Get in touch with Janta Power about three-dimensional solar for your project, campus, or community.",
  });
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
