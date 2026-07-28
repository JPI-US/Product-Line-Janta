import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CONTACT_PAGE_COPY, FOOTER_COPY } from "./websiteData";
import { WebsiteTurnstile } from "./WebsiteTurnstile";
import { useIsMobile } from "../../lib/useIsMobile";

type FormState = {
  name: string;
  email: string;
  company: string;
  phone: string;
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
  phone: "",
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

function RequiredMark() {
  return (
    <span className="web-footer__req" aria-hidden="true">
      *
    </span>
  );
}

export function WebsiteContactForm({
  showTitle = true,
  labelledBy,
  extended = false,
  layout = "default",
  ctaLabel,
}: {
  showTitle?: boolean;
  labelledBy?: string;
  /** Contact page: show project-type + site fields. Footer keeps the compact form. */
  extended?: boolean;
  /** `hero` = centered contact-page layout (CTA + privacy). */
  layout?: "default" | "hero";
  ctaLabel?: string;
}) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  // The bot-check script loads only once a visitor actually engages the form,
  // not on every page view (this form sits in the footer site-wide).
  const [engaged, setEngaged] = useState(false);
  const isMobile = useIsMobile("(max-width: 700px)");

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (status === "error") setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const projectType =
      form.projectType === OTHER ? form.projectTypeOther.trim() : form.projectType.trim();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus("error");
      return;
    }
    if (extended && !projectType) {
      setStatus("error");
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company,
          phone: form.phone,
          projectType,
          acreage: form.acreage,
          projectSize: form.projectSize,
          energyUsage: form.energyUsage,
          message: form.message,
          website: form.website,
          turnstileToken: token,
          extended,
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

  const projectSizeField = (
    <label className="web-footer__field web-footer__field--unit">
      <span className="visually-hidden">Project size in kW or MW</span>
      <input
        className="web-footer__input"
        type="text"
        name="projectSize"
        placeholder="Project size"
        value={form.projectSize}
        onChange={(e) => updateField("projectSize", e.target.value)}
      />
      <span className="web-footer__unit" aria-hidden>
        (kW)
      </span>
    </label>
  );

  const siteDetailFields = (
    <div className="web-footer__field-row web-footer__field-row--2">
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
      <label className="web-footer__field web-footer__field--unit">
        <span className="visually-hidden">Energy usage in kWh, if applicable</span>
        <input
          className="web-footer__input"
          type="text"
          name="energyUsage"
          placeholder="Energy usage (if applicable)"
          value={form.energyUsage}
          onChange={(e) => updateField("energyUsage", e.target.value)}
        />
        <span className="web-footer__unit" aria-hidden>
          (kWh)
        </span>
      </label>
    </div>
  );

  const projectTypeSelect = (
    <label
      className={`web-footer__field web-footer__field--required${isMobile ? " web-footer__field--full" : ""}`}
    >
      <span className="visually-hidden">Project type (required)</span>
      <select
        className="web-footer__input web-footer__select"
        name="projectType"
        value={form.projectType}
        required
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
      <RequiredMark />
    </label>
  );

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
          className={[
            extended ? "web-footer__form web-footer__form--extended" : "web-footer__form",
            layout === "hero" ? "web-footer__form--hero" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onSubmit={handleSubmit}
          onFocusCapture={() => setEngaged(true)}
          noValidate
        >
          {extended ? (
            <>
              <div className="web-footer__field-row">
                <label className="web-footer__field web-footer__field--required">
                  <span className="visually-hidden">Name (required)</span>
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
                  <RequiredMark />
                </label>
                <label className="web-footer__field">
                  <span className="visually-hidden">Company</span>
                  <input
                    className="web-footer__input"
                    type="text"
                    name="company"
                    placeholder="Company"
                    autoComplete="organization"
                    value={form.company}
                    onChange={(e) => updateField("company", e.target.value)}
                  />
                </label>
                <label className="web-footer__field">
                  <span className="visually-hidden">Phone</span>
                  <input
                    className="web-footer__input"
                    type="tel"
                    name="phone"
                    placeholder="Phone"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </label>
              </div>
              <label className="web-footer__field web-footer__field--full web-footer__field--required">
                <span className="visually-hidden">Email (required)</span>
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
                <RequiredMark />
              </label>

              {isMobile ? (
                projectTypeSelect
              ) : (
                <div className="web-footer__field-row web-footer__field-row--2">
                  {projectTypeSelect}
                  {projectSizeField}
                </div>
              )}

              {form.projectType === OTHER ? (
                <label className="web-footer__field web-footer__field--full web-footer__field--required">
                  <span className="visually-hidden">Please specify project type (required)</span>
                  <input
                    className="web-footer__input"
                    type="text"
                    name="projectTypeOther"
                    placeholder="Please specify"
                    required
                    value={form.projectTypeOther}
                    onChange={(e) => updateField("projectTypeOther", e.target.value)}
                  />
                  <RequiredMark />
                </label>
              ) : null}

              {isMobile ? null : siteDetailFields}

              <label className="web-footer__field web-footer__field--full web-footer__field--required">
                <span className="visually-hidden">Message (required)</span>
                <textarea
                  className="web-footer__textarea"
                  name="message"
                  placeholder={layout === "hero" ? "Message" : "How can we help?"}
                  rows={layout === "hero" ? (isMobile ? 3 : 5) : 3}
                  required
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                />
                <RequiredMark />
              </label>

              {isMobile ? (
                <details className="web-footer__details web-footer__field--full">
                  <summary className="web-footer__details-summary">
                    {CONTACT_PAGE_COPY.detailsToggle}
                  </summary>
                  <div className="web-footer__details-body">
                    {projectSizeField}
                    {siteDetailFields}
                  </div>
                </details>
              ) : null}
            </>
          ) : (
            <>
              <label className="web-footer__field web-footer__field--required">
                <span className="visually-hidden">Name (required)</span>
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
                <RequiredMark />
              </label>
              <label className="web-footer__field web-footer__field--required">
                <span className="visually-hidden">Email (required)</span>
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
                <RequiredMark />
              </label>
              <label className="web-footer__field">
                <span className="visually-hidden">Phone</span>
                <input
                  className="web-footer__input"
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </label>
              <label className="web-footer__field web-footer__field--full web-footer__field--required">
                <span className="visually-hidden">Message (required)</span>
                <textarea
                  className="web-footer__textarea"
                  name="message"
                  placeholder="How can we help?"
                  rows={3}
                  required
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                />
                <RequiredMark />
              </label>
            </>
          )}

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

          <div className="web-footer__actions">
            <button
              type="submit"
              className="web-footer__submit"
              disabled={status === "submitting"}
            >
              {status === "submitting"
                ? FOOTER_COPY.contactFormSending
                : (ctaLabel ?? FOOTER_COPY.contactFormCta)}
            </button>
            {layout === "hero" ? (
              <a
                className="web-footer__schedule"
                href={CONTACT_PAGE_COPY.consultHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                {CONTACT_PAGE_COPY.scheduleLabel}
                <span aria-hidden="true"> →</span>
              </a>
            ) : null}
          </div>

          <p className="web-footer__consent web-footer__field--full">
            By sending this inquiry you agree to our{" "}
            <Link to="/privacy" className="web-footer__consent-link">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      )}
    </div>
  );
}
