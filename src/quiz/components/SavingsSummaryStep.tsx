import { useMemo, useState, type ReactNode } from 'react'
import { CalendlyInline } from './CalendlyInline'
import { usePreliminarySolarEstimate } from '../hooks/usePreliminarySolarEstimate'
import {
  PROJECT_LIFE_YEARS,
  type SavingsProjectType,
} from '../lib/roiSpreadsheet'

/** Default scheduling page when `VITE_CALENDLY_URL` is not set. */
const DEFAULT_CALENDLY_EVENT_URL = 'https://calendly.com/jantapower/connect'

const JANTA_EMAIL = 'info@jantaus.com'
const JANTA_PHONE_DISPLAY = '(469) 694-3818'
const JANTA_PHONE_TEL = '+14696943818'

type ContactMethod = 'schedule' | 'email' | 'phone'

const CONTACT_METHODS: { id: ContactMethod; label: string; hint: string }[] = [
  { id: 'schedule', label: 'Book a call', hint: 'Schedule with Calendly' },
  { id: 'email', label: 'Email us', hint: JANTA_EMAIL },
  { id: 'phone', label: 'Call us', hint: JANTA_PHONE_DISPLAY },
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
      <header className="savings__header savings__header--summary">
        <h1 className="savings__title">Your estimated savings</h1>
        <p className="savings__hint">
          This is a preliminary prediction, not an official proposal or quote.
        </p>
      </header>

      <div className="savings-estimate">
        {estimate.status === 'loading' && (
          <p className="savings-estimate__status">Working out solar production and savings for your site…</p>
        )}
        {estimate.status === 'error' && (
          <p className="savings-estimate__status savings-estimate__status--error">{estimate.message}</p>
        )}
        {estimate.status === 'ok' && (
          <>
            <div className="savings-estimate__hero">
              <div className="savings-estimate__hero-value">
                {fmtUsd(estimate.roi.lifetimeNetSavingsUsd)}
              </div>
              <div className="savings-estimate__hero-label">
                Estimated savings over {PROJECT_LIFE_YEARS} years
              </div>
            </div>

            <div className="savings-estimate__metric-row" role="group" aria-label="Supporting estimates">
              <div className="savings-estimate__metric-box">
                <div className="savings-estimate__metric-value">
                  {fmtUsd(estimate.roi.netSavingsYear1Usd)}
                </div>
                <div className="savings-estimate__metric-label">First-year savings</div>
              </div>
              <div className="savings-estimate__metric-box">
                <div className="savings-estimate__metric-value">{estimate.systemCapacityKw} kW</div>
                <div className="savings-estimate__metric-label">System size</div>
              </div>
              <div className="savings-estimate__metric-box">
                <div className="savings-estimate__metric-value">
                  {fmtPct1(estimate.roi.offsetVsAnnualLoadPercent)}
                </div>
                <div className="savings-estimate__metric-label">Usage offset</div>
              </div>
            </div>

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
          Talk to our team
        </h2>

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
            <a className="savings-next savings-next--link" href={`mailto:${JANTA_EMAIL}`}>
              Email {JANTA_EMAIL}
            </a>
          </ContactPanel>
        )}

        {contactMethod === 'phone' && (
          <ContactPanel id="phone" label="Call us" action>
            <a className="savings-next savings-next--link" href={`tel:${JANTA_PHONE_TEL}`}>
              Call {JANTA_PHONE_DISPLAY}
            </a>
          </ContactPanel>
        )}
      </section>

      <div className="savings__actions savings__actions--nav savings-summary__footer">
        <button type="button" className="savings-back" onClick={onBack}>
          <span className="savings-back__arrow" aria-hidden>
            ←
          </span>
          <span>Back</span>
        </button>
        <button type="button" className="savings-ghost" onClick={onStartOver}>
          Start over
        </button>
      </div>
    </div>
  )
}
