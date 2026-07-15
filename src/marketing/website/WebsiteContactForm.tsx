import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FOOTER_COPY } from "./websiteData";
import { WebsiteTurnstile } from "./WebsiteTurnstile";

type FormState = {
  name: string;
  email: string;
  company: string;
  projectType: string;
  projectTypeOther: string;
  acreage: string;
  projectSize: string;
  energyUsage: string;
  message: string;
  /** Honeypot — must stay empty. Real users never see or fill this. */
  website: string;
};

const INITIAL: FormState = {
  name: "",
  email: "",
  company: "",
  projectType: "",
  projectTypeOther: "",
  acreage: "",
  projectSize: "",
  energyUsage: "",
  message: "",
  website: "",
};

const PROJECT_TYPES = [
  "Residential",
  "Commercial",
  "Industrial",
  "Utility",
  "Other (please specify)",
] as const;

const OTHER = "Other (please specify)";

type Status = "idle" | "submitting" | "error";

export function WebsiteContactForm({
  showTitle = true,
  labelledBy,
  extended = false,
}: {
  showTitle?: boolean;
  labelledBy?: string;
  /** Contact page: show project-type + site fields. Footer keeps the compact form. */
  extended?: boolean;
}) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  // The bot-check script loads only once a visitor actually engages the form,
  // not on every page view (this form sits in the footer site-wide).
  const [engaged, setEngaged] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (status === "error") setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");

    const projectType =
      form.projectType === OTHER ? form.projectTypeOther : form.projectType;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company,
          projectType,
          acreage: form.acreage,
          projectSize: form.projectSize,
          energyUsage: form.energyUsage,
          message: form.message,
          website: form.website,
          turnstileToken: token,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (res.ok && data.ok) {
        setSubmitted(true);
        setForm(INITIAL);
        setToken(null);
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
    // Tokens are single-use — force a fresh one before the next attempt.
    setToken(null);
    setResetSignal((n) => n + 1);
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
        <form
          className={
            extended ? "web-footer__form web-footer__form--extended" : "web-footer__form"
          }
          onSubmit={handleSubmit}
          onFocusCapture={() => setEngaged(true)}
          noValidate
        >
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
          <label className="web-footer__field web-footer__field--full">
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

          {extended ? (
            <>
              <label className="web-footer__field web-footer__field--full">
                <span className="visually-hidden">Project type</span>
                <select
                  className="web-footer__input web-footer__select"
                  name="projectType"
                  value={form.projectType}
                  onChange={(e) => updateField("projectType", e.target.value)}
                >
                  <option value="" disabled>
                    Project type
                  </option>
                  {PROJECT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              {form.projectType === OTHER ? (
                <label className="web-footer__field web-footer__field--full">
                  <span className="visually-hidden">Please specify project type</span>
                  <input
                    className="web-footer__input"
                    type="text"
                    name="projectTypeOther"
                    placeholder="Please specify"
                    value={form.projectTypeOther}
                    onChange={(e) => updateField("projectTypeOther", e.target.value)}
                  />
                </label>
              ) : null}

              <label className="web-footer__field">
                <span className="visually-hidden">Acreage</span>
                <input
                  className="web-footer__input"
                  type="text"
                  inputMode="decimal"
                  name="acreage"
                  placeholder="Acreage"
                  value={form.acreage}
                  onChange={(e) => updateField("acreage", e.target.value)}
                />
              </label>
              <label className="web-footer__field">
                <span className="visually-hidden">Project size in kW or MW (optional)</span>
                <input
                  className="web-footer__input"
                  type="text"
                  name="projectSize"
                  placeholder="Project size, kW or MW (optional)"
                  value={form.projectSize}
                  onChange={(e) => updateField("projectSize", e.target.value)}
                />
              </label>
              <label className="web-footer__field web-footer__field--full">
                <span className="visually-hidden">Energy usage (optional)</span>
                <input
                  className="web-footer__input"
                  type="text"
                  name="energyUsage"
                  placeholder="Energy usage (optional)"
                  value={form.energyUsage}
                  onChange={(e) => updateField("energyUsage", e.target.value)}
                />
              </label>
            </>
          ) : null}

          <label className="web-footer__field web-footer__field--full">
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

          {/* Honeypot: off-screen and hidden from assistive tech; bots fill it. */}
          <div className="web-footer__hp" aria-hidden>
            <label>
              Website
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
              />
            </label>
          </div>

          {engaged ? (
            <div className="web-footer__field--full">
              <WebsiteTurnstile onToken={setToken} resetSignal={resetSignal} />
            </div>
          ) : null}

          {status === "error" ? (
            <p className="web-footer__contact-error web-footer__field--full" role="alert">
              {FOOTER_COPY.contactFormError}
            </p>
          ) : null}

          <button
            type="submit"
            className="web-footer__submit"
            disabled={status === "submitting"}
          >
            {status === "submitting"
              ? FOOTER_COPY.contactFormSending
              : FOOTER_COPY.contactFormCta}
          </button>

          <p className="web-footer__consent web-footer__field--full">
            By sending this you agree to our{" "}
            <Link to="/privacy" className="web-footer__consent-link">
              Privacy Policy
            </Link>
            . We use your details only to reply to your inquiry.
          </p>
        </form>
      )}
    </div>
  );
}
