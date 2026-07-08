import { useMemo, useState, type ReactNode } from "react";
import { SavingsSummaryStep } from "./components/SavingsSummaryStep";
import type { SavingsProjectType as ProjectType } from "./lib/roiSpreadsheet";
import "./SavingsPage.css";

const projectOptions: {
  id: ProjectType;
  label: string;
  icon: ReactNode;
  hoverImageSrc: string;
}[] = [
  {
    id: "residential",
    label: "Residential",
    icon: <IconResidential />,
    hoverImageSrc: "/project-types/residential.svg",
  },
  {
    id: "commercial",
    label: "Commercial",
    icon: <IconCommercial />,
    hoverImageSrc: "/project-types/commercial.svg",
  },
  {
    id: "industrial",
    label: "Industrial",
    icon: <IconIndustrial />,
    hoverImageSrc: "/project-types/industrial.svg",
  },
  {
    id: "utility",
    label: "Utility",
    icon: <IconUtility />,
    hoverImageSrc: "/project-types/utility.svg",
  },
];

function IconResidential() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <circle cx="38" cy="11" r="7" fill="currentColor" opacity="0.26" />
      <rect x="8" y="28" width="32" height="11" rx="0.5" fill="currentColor" />
      <polygon fill="currentColor" points="24,7 5,28 43,28" />
      <rect x="12.5" y="15" width="23" height="7" rx="1" fill="currentColor" opacity="0.36" />
      <rect x="18" y="31" width="12" height="7.5" rx="1" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

function IconCommercial() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <rect x="5" y="25" width="11" height="14" rx="1.5" fill="currentColor" opacity="0.82" />
      <rect x="17" y="11" width="14" height="28" rx="1.5" fill="currentColor" />
      <rect x="32" y="19" width="11" height="20" rx="1.5" fill="currentColor" opacity="0.88" />
      <rect x="7.5" y="28" width="6" height="4" rx="0.5" fill="currentColor" opacity="0.22" />
      <rect x="34.5" y="23" width="6" height="4" rx="0.5" fill="currentColor" opacity="0.22" />
      <rect x="20" y="15" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.22" />
      <rect x="20" y="21" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.22" />
      <rect x="20" y="27" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.22" />
    </svg>
  );
}

function IconIndustrial() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <rect x="6" y="26" width="36" height="10" rx="1" fill="currentColor" />
      <rect x="10" y="18" width="8" height="8" fill="currentColor" opacity="0.88" />
      <rect x="20" y="14" width="10" height="12" fill="currentColor" />
      <rect x="32" y="20" width="8" height="6" fill="currentColor" opacity="0.88" />
      <rect x="34" y="8" width="4" height="14" fill="currentColor" opacity="0.65" />
      <rect x="12" y="28" width="2" height="3" fill="currentColor" opacity="0.35" />
      <rect x="17" y="28" width="2" height="3" fill="currentColor" opacity="0.35" />
      <rect x="26" y="28" width="2" height="3" fill="currentColor" opacity="0.35" />
      <rect x="31" y="28" width="2" height="3" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function IconUtility() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path
        fill="currentColor"
        d="M27 5L14 26h9.5L17 43l17.5-23.5H26L27 5z"
      />
    </svg>
  );
}

function progressForStep(step: number) {
  if (step <= 1) return 8;
  return ((step - 1) / 4) * 100;
}

export function SavingsPage() {
  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState<ProjectType | null>(null);
  const [location, setLocation] = useState("");
  const [kwh, setKwh] = useState("");
  const [bill, setBill] = useState("");

  const progress = useMemo(() => {
    if (step >= 5) return 100;
    return progressForStep(step);
  }, [step]);

  const canAdvance = useMemo(() => {
    if (step === 1) return projectType !== null;
    if (step === 2) return location.trim().length >= 2;
    if (step === 3) return kwh.trim().length > 0 && !Number.isNaN(Number(kwh.replace(/,/g, "")));
    if (step === 4) return bill.trim().length > 0;
    return false;
  }, [step, projectType, location, kwh, bill]);

  function handleNext() {
    if (step < 4) {
      setStep((s) => s + 1);
      return;
    }
    setStep(5);
  }

  function handleBack() {
    setStep((s) => (s > 1 ? s - 1 : s));
  }

  const heading =
    step === 1
      ? "PROJECT TYPE"
      : step === 2
        ? "SITE LOCATION"
        : step === 3
          ? "ENERGY USAGE"
          : step === 4
            ? "ELECTRICITY COSTS"
            : "SUMMARY";

  return (
    <main className="savings">
      <div className="savings__shell">
        <div className="savings-card">
          <div
            className="savings-card__progress"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Form progress"
          >
            <div className="savings-card__progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div
            className={
              step === 5
                ? "savings-card__body savings-card__body--summary"
                : step >= 2 && step <= 4
                  ? "savings-card__body savings-card__body--field"
                  : "savings-card__body"
            }
          >
            {step <= 4 && (
              <>
                <h1 className="savings-card__title">{heading}</h1>
                {step === 2 && (
                  <p className="savings-card__hint">
                    Location is required to calculate energy output and savings.
                  </p>
                )}
                {step === 3 && (
                  <p className="savings-card__hint">
                    Please provide your estimated average monthly energy usage (kWh)
                  </p>
                )}
                {step === 4 && (
                  <p className="savings-card__hint">
                    Please provide an estimate of your average monthly bill.
                  </p>
                )}

                {step === 1 && (
                  <div className="savings-grid" role="group" aria-label="Project type">
                    {projectOptions.map((opt) => {
                      const selected = projectType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={`savings-tile${selected ? " savings-tile--selected" : ""}`}
                          onClick={() =>
                            setProjectType((current) => (current === opt.id ? null : opt.id))
                          }
                          aria-pressed={selected}
                        >
                          <span className="savings-tile__media" aria-hidden>
                            <span
                              className="savings-tile__media-bg"
                              style={{ backgroundImage: `url("${opt.hoverImageSrc}")` }}
                            />
                            <span className="savings-tile__media-scrim" />
                          </span>
                          {selected && (
                            <span className="savings-tile__check" aria-hidden>
                              ✓
                            </span>
                          )}
                          <span className="savings-tile__front">
                            <span className="savings-tile__icon">{opt.icon}</span>
                            <span className="savings-tile__label">{opt.label}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {step === 2 && (
                  <label className="savings-field">
                    <span className="visually-hidden">Site address</span>
                    <input
                      className="savings-input"
                      type="text"
                      autoComplete="street-address"
                      placeholder="Street & city, state, or ZIP"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </label>
                )}

                {step === 3 && (
                  <label className="savings-field">
                    <span className="visually-hidden">Monthly energy usage in kWh</span>
                    <div className="savings-input-wrap">
                      <input
                        className="savings-input savings-input--with-suffix"
                        inputMode="decimal"
                        placeholder="Energy Usage"
                        value={kwh}
                        onChange={(e) => setKwh(e.target.value.replace(/[^\d.]/g, ""))}
                      />
                      <span className="savings-input-suffix">kWh</span>
                    </div>
                  </label>
                )}

                {step === 4 && (
                  <label className="savings-field">
                    <span className="visually-hidden">Average monthly bill in dollars</span>
                    <input
                      className="savings-input"
                      inputMode="decimal"
                      placeholder="$350"
                      value={bill}
                      onChange={(e) => setBill(e.target.value.replace(/[^\d.]/g, ""))}
                    />
                  </label>
                )}
              </>
            )}

            {step === 5 && (
              <SavingsSummaryStep
                projectLabel={projectOptions.find((o) => o.id === projectType)?.label ?? "n/a"}
                projectType={projectType}
                location={location}
                kwh={kwh}
                bill={bill}
                onBack={handleBack}
                onStartOver={() => setStep(1)}
              />
            )}
          </div>

          {step <= 4 && (
            <div
              className={`savings-card__footer${step > 1 ? " savings-card__footer--nav" : ""}`}
            >
              {step > 1 && (
                <button type="button" className="savings-back" onClick={handleBack}>
                  <span className="savings-back__arrow" aria-hidden>
                    ←
                  </span>
                  <span>Previous Page</span>
                </button>
              )}
              <button
                type="button"
                className="savings-next"
                onClick={handleNext}
                disabled={!canAdvance}
                title={canAdvance ? undefined : "Complete this step to continue"}
              >
                <span>Next Page</span>
                <span className="savings-next__arrow" aria-hidden>
                  {" "}
                  →
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
