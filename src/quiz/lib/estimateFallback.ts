import {
  initialSystemKwFromAnnualUsage,
  snapSystemKwToStep,
  SYSTEM_SIZE_STEP_KW,
  USAGE_OFFSET_BAND,
} from './pvwatts'

/** Typical first-year AC yield for 2-axis tracking (kWh per kWdc). */
const MODEL_YIELD_KWH_PER_KW = 2600

export type LocalProductionEstimate = {
  system_capacity_kw: number
  ac_annual_kwh: number
  capacity_factor?: number
  estimateSource: 'model'
}

/** Offline sizing when NREL is unavailable or rate-limited (no API key / DEMO_KEY). */
export function sizeProductionEstimateLocal(input: {
  annualUsageKwh: number
}): LocalProductionEstimate {
  const annual = Math.max(1, input.annualUsageKwh)
  let kw = initialSystemKwFromAnnualUsage(annual)
  let ac = kw * MODEL_YIELD_KWH_PER_KW

  const targetAc = USAGE_OFFSET_BAND.target * annual
  kw = snapSystemKwToStep(targetAc / MODEL_YIELD_KWH_PER_KW)
  ac = kw * MODEL_YIELD_KWH_PER_KW

  let guard = 0
  while (guard++ < 120) {
    const ratio = ac / annual
    if (ratio >= USAGE_OFFSET_BAND.min && ratio <= USAGE_OFFSET_BAND.max) break
    if (ratio > USAGE_OFFSET_BAND.max && kw > SYSTEM_SIZE_STEP_KW) {
      kw -= SYSTEM_SIZE_STEP_KW
    } else if (ratio < USAGE_OFFSET_BAND.min) {
      kw += SYSTEM_SIZE_STEP_KW
    } else {
      break
    }
    ac = kw * MODEL_YIELD_KWH_PER_KW
  }

  const capacity_factor = kw > 0 ? (ac / (kw * 8760)) * 100 : undefined

  return {
    system_capacity_kw: kw,
    ac_annual_kwh: ac,
    capacity_factor,
    estimateSource: 'model',
  }
}

export function shouldUseLocalPvwattsEstimate(): boolean {
  const key = import.meta.env.VITE_NREL_API_KEY?.trim()
  return !key || key === 'DEMO_KEY'
}
