/**
 * Preliminary savings / ROI — structured so we can align 1:1 with your Excel once you share it.
 *
 * Current chain (typical spreadsheet layout):
 *
 * 1) **System size (kWdc)** — from PVWatts sizing loop so modeled **ac_annual** sits in the usage band.
 *
 * 2) **Production** — PVWatts returns **ac_annual** (kWh/yr). Internally that already reflects
 *    resource, losses, DC/AC ratio, and **capacity factor** (PVWatts reports CF as first-year
 *    energy / nameplate-equivalent output).
 *
 * 3) **Energy savings ($/yr)** — we value displaced kWh at your **effective blended utility $/kWh**
 *    from the wizard: `(monthly bill × 12) / (monthly kWh × 12)`.
 *    **Offset kWh** = `min(ac_annual, annual_usage)` (no export credit in this stub).
 *    **Gross $ savings** = `offset_kWh × effective_$/kWh`.
 *
 * 4) **Capex** — **gross_installed $ = system_kWdc × installed_cost_$/kWdc** (flat **3000** until
 *    you supply a per-state $/kW table). Then **net capex** after a **30%** generic incentive
 *    ({@link CAPEX_INCENTIVE_FRACTION}), **O&M** as % of net. This does not change displayed bill savings.
 *
 * 5) **ROI / payback** — first-year **net savings** = gross energy savings − O&M;
 *    **simple payback** = net capex / net savings; **first-year ROI %** = net savings / net capex.
 *    **Lifetime savings** applies {@link UTILITY_RATE_ESCALATION_ANNUAL} annual utility rate escalation to
 *    year-1 gross bill savings, sums over {@link PROJECT_LIFE_YEARS} years, and subtracts flat annual O&M each year
 *    (production held flat).
 *
 * When you send the workbook, we’ll replace the constants below with named columns / cell refs.
 */

export type SavingsProjectType = 'residential' | 'commercial' | 'industrial' | 'utility'

/** Gross installed cost ($/kWdc). Replace with state-specific table later. */
export const INSTALLED_COST_USD_PER_KWDC = 3000

/** Generic capex incentive — 30% off gross installed cost (net capex = 70% of gross). */
export const CAPEX_INCENTIVE_FRACTION = 0.3

export const ROI_SPREADSHEET_DEFAULTS = {
  /** Portion of capex covered by incentives (0–1) */
  incentiveFractionOfCapex: CAPEX_INCENTIVE_FRACTION,
  /** Annual O&M + insurance as fraction of net capex */
  omFractionOfNetCapexPerYear: 0.012,
} as const

/** Simple lifetime horizon for cumulative savings sum. */
export const PROJECT_LIFE_YEARS = 25

/**
 * Assumed annual utility rate escalation (0.03 = 3%/yr). Year-t **gross** utility $ savings modeled as
 * `grossUtilitySavingsYear1 × (1 + rate)^(t-1)`; lifetime net sums those and subtracts flat O&M each year.
 */
export const UTILITY_RATE_ESCALATION_ANNUAL = 0.03

/** Sum of (1+r)^(t-1) for t = 1..years = ((1+r)^years - 1) / r when r ≠ 0. */
export function cumulativeSavingsEscalationFactor(years: number, annualRate: number): number {
  if (years <= 0 || !Number.isFinite(years)) return 0
  const r = annualRate
  if (!Number.isFinite(r) || Math.abs(r) < 1e-12) return years
  const g = 1 + r
  return (Math.pow(g, years) - 1) / r
}

/** Placeholder until we map state from geocode + your $/kW sheet. */
export function installedCostUsdPerKwdc(input: {
  stateCode?: string | undefined
  projectType: SavingsProjectType | null
}): number {
  void input
  return INSTALLED_COST_USD_PER_KWDC
}

export type PreliminaryRoi = {
  /** Modeled PV AC energy (kWh/yr) at sized `system_capacity_kw` from PVWatts */
  modeledAcAnnualKwh: number
  systemCapacityKw: number
  /** PVWatts first-year capacity factor (%) — diagnostic; production is `ac_annual`. */
  capacityFactorPercent?: number
  /** $/kWdc used for gross capex (before incentives) */
  installedCostUsdPerKwdc: number
  /** Effective blended $/kWh from bill ÷ usage */
  effectiveUtilityRatePerKwh: number
  /** kWh of utility energy replaced in year 1 (min of usage and modeled production) */
  offsetKwhYear1: number
  /** Year-1 utility $ avoided (before O&M) */
  grossUtilitySavingsYear1Usd: number
  /** Gross installed cost before incentives ($) */
  grossCapexUsd: number
  /** Net installed cost after incentives ($) */
  netCapexUsd: number
  /** Year-1 net cash benefit after simple O&M */
  netSavingsYear1Usd: number
  /**
   * Cumulative net savings over {@link PROJECT_LIFE_YEARS} years: utility savings grow at
   * {@link UTILITY_RATE_ESCALATION_ANNUAL} per year; annual O&M ($) is held flat (production flat).
   */
  lifetimeNetSavingsUsd: number
  /** Modeled production ÷ annual usage × 100 (can exceed 100% when production exceeds load). */
  offsetVsAnnualLoadPercent: number
  /** netSavingsYear1 / netCapex */
  firstYearRoiPercent: number
  /** netCapex / netSavingsYear1 */
  simplePaybackYears: number | null
}

export function computePreliminaryRoi(input: {
  monthlyUsageKwh: number
  monthlyBillUsd: number
  modeledAcAnnualKwh: number
  systemCapacityKw: number
  projectType: SavingsProjectType | null
  /** From PVWatts `outputs.capacity_factor` (already a percentage in API, e.g. 18.5) */
  capacityFactorPercent?: number
  stateCode?: string | undefined
}): PreliminaryRoi {
  const annualUsageKwh = Math.max(1, input.monthlyUsageKwh * 12)
  const annualBillUsd = Math.max(1, input.monthlyBillUsd * 12)
  const effectiveUtilityRatePerKwh = annualBillUsd / annualUsageKwh

  const prod = Math.max(0, input.modeledAcAnnualKwh)
  const offsetKwhYear1 = Math.min(annualUsageKwh, prod)
  const grossUtilitySavingsYear1Usd = offsetKwhYear1 * effectiveUtilityRatePerKwh

  const usdPerKw = installedCostUsdPerKwdc({
    stateCode: input.stateCode,
    projectType: input.projectType,
  })
  const grossCapexUsd = input.systemCapacityKw * usdPerKw
  const netCapexUsd = Math.max(
    1,
    grossCapexUsd * (1 - ROI_SPREADSHEET_DEFAULTS.incentiveFractionOfCapex),
  )
  const omUsd =
    netCapexUsd * ROI_SPREADSHEET_DEFAULTS.omFractionOfNetCapexPerYear
  const netSavingsYear1Usd = Math.max(0, grossUtilitySavingsYear1Usd - omUsd)
  const esc = cumulativeSavingsEscalationFactor(PROJECT_LIFE_YEARS, UTILITY_RATE_ESCALATION_ANNUAL)
  const lifetimeNetSavingsUsd = Math.max(
    0,
    grossUtilitySavingsYear1Usd * esc - omUsd * PROJECT_LIFE_YEARS,
  )
  const offsetVsAnnualLoadPercent = (prod / annualUsageKwh) * 100

  const firstYearRoiPercent = (netSavingsYear1Usd / netCapexUsd) * 100
  const simplePaybackYears =
    netSavingsYear1Usd > 0 ? netCapexUsd / netSavingsYear1Usd : null

  return {
    modeledAcAnnualKwh: prod,
    systemCapacityKw: input.systemCapacityKw,
    capacityFactorPercent: input.capacityFactorPercent,
    installedCostUsdPerKwdc: usdPerKw,
    effectiveUtilityRatePerKwh,
    offsetKwhYear1,
    grossUtilitySavingsYear1Usd,
    grossCapexUsd,
    netCapexUsd,
    netSavingsYear1Usd,
    lifetimeNetSavingsUsd,
    offsetVsAnnualLoadPercent,
    firstYearRoiPercent,
    simplePaybackYears,
  }
}
