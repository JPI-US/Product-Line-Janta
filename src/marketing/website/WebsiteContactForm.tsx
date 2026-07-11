import { useState, type FormEvent } from "react";
import { FOOTER_COPY } from "./websiteData";

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
};

const PROJECT_TYPES = [
  "Residential",
  "Commercial",
  "Industrial",
  "Utility",
  "Other (please specify)",
] as const;

const OTHER = "Other (please specify)";

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

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const projectType =
      form.projectType === OTHER ? form.projectTypeOther : form.projectType;
    const subject = encodeURIComponent(`Janta Power inquiry from ${form.name}`);
    const body = encodeURIComponent(
      [
        `Name: ${form.name}`,
        `Email: ${form.email}`,
        form.company ? `Company: ${form.company}` : null,
        projectType ? `Project type: ${projectType}` : null,
        form.acreage ? `Acreage: ${form.acreage}` : null,
        form.projectSize ? `Project size: ${form.projectSize}` : null,
        form.energyUsage ? `Energy usage: ${form.energyUsage}` : null,
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
        <form
          className={
            extended ? "web-footer__form web-footer__form--extended" : "web-footer__form"
          }
          onSubmit={handleSubmit}
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
          <button type="submit" className="web-footer__submit">
            {FOOTER_COPY.contactFormCta}
          </button>
        </form>
      )}
    </div>
  );
}
