import { useMemo, useState, type ReactNode } from 'react'
import { CalendlyInline } from './CalendlyInline'
import { usePreliminarySolarEstimate } from '../hooks/usePreliminarySolarEstimate'
import {
  PROJECT_LIFE_YEARS,
  UTILITY_RATE_ESCALATION_ANNUAL,
  type SavingsProjectType,
} from '../lib/roiSpreadsheet'

/** Default scheduling page when `VITE_CALENDLY_URL` is not set. */
const DEFAULT_CALENDLY_EVENT_URL = 'https://calendly.com/jantapower/connect'

const JANTA_EMAIL = 'info@jantaus.com'
const JANTA_PHONE_DISPLAY = '(469) 694-3818'
const JANTA_PHONE_TEL = '+14696943818'

type ContactMethod = 'schedule' | 'email' | 'phone' | 'form'

const CONTACT_METHODS: { id: ContactMethod; label: string; hint: string }[] = [
  { id: 'schedule', label: 'Book a call', hint: 'Schedule with Calendly' },
  { id: 'email', label: 'Email us', hint: JANTA_EMAIL },
  { id: 'phone', label: 'Call us', hint: JANTA_PHONE_DISPLAY },
  { id: 'form', label: 'Contact form', hint: 'On jantaus.com' },
]

type Props = {
  projectLabel: string
  projectType: SavingsProjectType | null
  location: string
  kwh: string
  bill: string
  onBack: () => void
  onStartOver: () => void
}

function parseNum(s: string): number {
  const n = Number(s.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

function fmtUsd(n: number): string {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function fmtKwh(n: number): string {
  return `${Math.round(n).toLocaleString()} kWh`
}

function fmtPct1(n: number): string {
  return `${n.toFixed(1)}%`
}

function ContactPanel({
  id,
  label,
  action,
  children,
}: {
  id: string
  label: string
  action?: boolean
  children: ReactNode
}) {
  return (
    <div
      role="tabpanel"
      id={`contact-panel-${id}`}
      aria-labelledby={`contact-tab-${id}`}
      className={action ? 'savings-contact__panel savings-contact__panel--action' : 'savings-contact__panel'}
    >
      <span className="visually-hidden">{label}</span>
      {children}
    </div>
  )
}

export function SavingsSummaryStep({
  projectLabel,
  projectType,
  location,
  kwh,
  bill,
  onBack,
  onStartOver,
}: Props) {
  const monthlyUsageKwh = useMemo(() => parseNum(kwh), [kwh])
  const monthlyBillUsd = useMemo(() => parseNum(bill), [bill])
  const [contactMethod, setContactMethod] = useState<ContactMethod>('schedule')

  const calendlyUrl = useMemo(
    () => import.meta.env.VITE_CALENDLY_URL?.trim() || DEFAULT_CALENDLY_EVENT_URL,
    [],
  )

  const estimate = usePreliminarySolarEstimate({
    enabled: true,
    location,
    monthlyUsageKwh,
    monthlyBillUsd,
    projectType,
  })

  return (
    <div className="savings-summary">
      <h1 className="savings-card__title">Your estimated savings</h1>
      <p className="savings-card__hint">Quick savings estimate only, not a quote or site visit.</p>

      <div className="savings-estimate">
        {estimate.status === 'loading' && (
          <p className="savings-estimate__status">Working out solar production and savings for your site…</p>
        )}
        {estimate.status === 'error' && (
          <p className="savings-estimate__status savings-estimate__status--error">{estimate.message}</p>
        )}
        {estimate.status === 'ok' && (
          <>
            <div className="savings-estimate__metric-row" role="group" aria-label="Key system metrics">
              <div className="savings-estimate__metric-box">
                <div className="savings-estimate__metric-value">{estimate.systemCapacityKw} kW</div>
                <div className="savings-estimate__metric-label">Est. system size</div>
              </div>
              <div className="savings-estimate__metric-box">
                <div className="savings-estimate__metric-value">
                  {fmtPct1(estimate.roi.offsetVsAnnualLoadPercent)}
                </div>
                <div className="savings-estimate__metric-label">Offset vs annual usage</div>
              </div>
            </div>
            <ul className="savings-estimate__stats">
              <li className="savings-estimate__stat savings-estimate__stat--savings">
                <span className="savings-estimate__label">Estimated savings on your electric bill (first year)</span>
                <span className="savings-estimate__value">{fmtUsd(estimate.roi.netSavingsYear1Usd)} per year</span>
              </li>
              <li className="savings-estimate__stat savings-estimate__stat--savings">
                <span className="savings-estimate__label">
                  Rough cumulative savings over {PROJECT_LIFE_YEARS} years (
                  {(UTILITY_RATE_ESCALATION_ANNUAL * 100).toFixed(0)}% annual utility rate escalation)
                </span>
                <span className="savings-estimate__value">{fmtUsd(estimate.roi.lifetimeNetSavingsUsd)} total</span>
              </li>
            </ul>
          </>
        )}
      </div>

      <details className="savings-summary__details">
        <summary className="savings-summary__details-toggle">Your project details</summary>
        <ul className="savings-summary__list savings-summary__list--compact">
          <li>
            <span className="savings-summary__k">Project</span>
            <span className="savings-summary__v">{projectLabel}</span>
          </li>
          <li>
            <span className="savings-summary__k">Location</span>
            <span className="savings-summary__v">{location || 'n/a'}</span>
          </li>
          <li>
            <span className="savings-summary__k">Monthly usage</span>
            <span className="savings-summary__v">{kwh ? fmtKwh(monthlyUsageKwh) + '/mo' : 'n/a'}</span>
          </li>
          <li>
            <span className="savings-summary__k">Monthly bill</span>
            <span className="savings-summary__v">{bill ? fmtUsd(monthlyBillUsd) + '/mo' : 'n/a'}</span>
          </li>
        </ul>
      </details>

      <section className="savings-contact savings-contact--options" aria-labelledby="savings-contact-heading">
        <h2 id="savings-contact-heading" className="savings-contact__title">
          Get in touch with Janta
        </h2>
        <p className="savings-contact__hint">
          Choose how you&apos;d like to reach us: book a call, send an email, call directly, or use our site contact
          form.
        </p>

        <ul className="savings-contact__methods" role="tablist" aria-label="Contact options">
          {CONTACT_METHODS.map((method) => (
            <li key={method.id}>
              <button
                type="button"
                role="tab"
                id={`contact-tab-${method.id}`}
                className={`savings-contact__method${contactMethod === method.id ? ' savings-contact__method--active' : ''}`}
                aria-selected={contactMethod === method.id}
                aria-controls={`contact-panel-${method.id}`}
                onClick={() => setContactMethod(method.id)}
              >
                <span className="savings-contact__method-label">{method.label}</span>
                <span className="savings-contact__method-hint">{method.hint}</span>
              </button>
            </li>
          ))}
        </ul>

        {contactMethod === 'schedule' && (
          <ContactPanel id="schedule" label="Book a call">
            <CalendlyInline url={calendlyUrl} />
          </ContactPanel>
        )}

        {contactMethod === 'email' && (
          <ContactPanel id="email" label="Email us" action>
            <p className="savings-contact__panel-text">
              Send your project details and we&apos;ll follow up by email.
            </p>
            <a className="savings-next savings-next--link" href={`mailto:${JANTA_EMAIL}`}>
              Email {JANTA_EMAIL}
            </a>
          </ContactPanel>
        )}

        {contactMethod === 'phone' && (
          <ContactPanel id="phone" label="Call us" action>
            <p className="savings-contact__panel-text">
              Speak with our team during business hours.
            </p>
            <a className="savings-next savings-next--link" href={`tel:${JANTA_PHONE_TEL}`}>
              Call {JANTA_PHONE_DISPLAY}
            </a>
          </ContactPanel>
        )}

        {contactMethod === 'form' && (
          <ContactPanel id="form" label="Contact form" action>
            <p className="savings-contact__panel-text">
              Our full contact form lives on jantaus.com. This button will link there soon.
            </p>
            <button type="button" className="savings-next savings-contact__panel-placeholder" disabled>
              Open contact form
            </button>
          </ContactPanel>
        )}
      </section>

      <div className="savings-card__footer savings-card__footer--split savings-summary__footer">
        <button type="button" className="savings-back" onClick={onBack}>
          <span className="savings-back__arrow" aria-hidden>
            ←
          </span>
          <span>Previous Page</span>
        </button>
        <button type="button" className="savings-ghost" onClick={onStartOver}>
          Start over
        </button>
      </div>
    </div>
  )
}
