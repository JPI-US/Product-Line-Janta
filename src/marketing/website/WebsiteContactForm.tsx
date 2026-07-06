import { useState, type FormEvent } from "react";
import { FOOTER_COPY } from "./websiteData";

type FormState = {
  name: string;
  email: string;
  company: string;
  message: string;
};

const INITIAL: FormState = {
  name: "",
  email: "",
  company: "",
  message: "",
};

export function WebsiteContactForm({
  showTitle = true,
  labelledBy,
}: {
  showTitle?: boolean;
  labelledBy?: string;
}) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitted, setSubmitted] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent(`Janta Power inquiry from ${form.name}`);
    const body = encodeURIComponent(
      [
        `Name: ${form.name}`,
        `Email: ${form.email}`,
        form.company ? `Company: ${form.company}` : null,
        "",
        form.message,
      ]
        .filter(Boolean)
        .join("\n"),
    );
    window.location.href = `mailto:${FOOTER_COPY.contactEmail}?subject=${subject}&body=${body}`;
    setSubmitted(true);
    setForm(INITIAL);
  }

  return (
    <div
      id="contact"
      className="web-footer__contact"
      aria-labelledby={labelledBy ?? (showTitle ? "web-footer-contact-title" : undefined)}
    >
      {showTitle ? (
        <h2 id="web-footer-contact-title" className="web-footer__heading">
          {FOOTER_COPY.contactFormTitle}
        </h2>
      ) : null}
      {submitted ? (
        <p className="web-footer__contact-success" role="status">
          {FOOTER_COPY.contactFormSuccess}
        </p>
      ) : (
        <form className="web-footer__form" onSubmit={handleSubmit}>
          <label className="web-footer__field">
            <span className="visually-hidden">Name</span>
            <input
              className="web-footer__input"
              type="text"
              name="name"
              placeholder="Name"
              autoComplete="name"
              required
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </label>
          <label className="web-footer__field">
            <span className="visually-hidden">Email</span>
            <input
              className="web-footer__input"
              type="email"
              name="email"
              placeholder="Email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </label>
          <label className="web-footer__field">
            <span className="visually-hidden">Company (optional)</span>
            <input
              className="web-footer__input"
              type="text"
              name="company"
              placeholder="Company (optional)"
              autoComplete="organization"
              value={form.company}
              onChange={(e) => updateField("company", e.target.value)}
            />
          </label>
          <label className="web-footer__field">
            <span className="visually-hidden">Message</span>
            <textarea
              className="web-footer__textarea"
              name="message"
              placeholder="How can we help?"
              rows={3}
              required
              value={form.message}
              onChange={(e) => updateField("message", e.target.value)}
            />
          </label>
          <button type="submit" className="web-footer__submit">
            {FOOTER_COPY.contactFormCta}
          </button>
        </form>
      )}
    </div>
  );
}
