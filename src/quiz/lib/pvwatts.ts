/**
 * PVWatts v8 — same engine used in SAM’s PVWatts path (NREL / NLR Developer Network).
 * SAM UI inputs (tilt, azimuth, tracking, module, DC/AC, losses) are applied here; lat/lon come
 * from the user’s site address via geocoding.
 *
 * @see https://developer.nrel.gov/docs/solar/pvwatts/v8/
 */

import { readJsonResponse } from './readJsonResponse'
import {
  shouldUseLocalPvwattsEstimate,
  sizeProductionEstimateLocal,
} from './estimateFallback'

export type PvwattsV8Response = {
  errors?: string[]
  warnings?: string[]
  outputs?: {
    ac_annual?: number
    capacity_factor?: number
  }
}

/** SAM / PVWatts inputs aligned to your tower model (2-axis = array_type 4). */
export const SAM_PVWATTS_INPUTS = {
  tilt_deg: 60,
  azimuth_deg: 180,
  /** 4 = 2-axis (Azimuthal axis) */
  array_type: 4 as const,
  /** 0 = Standard */
  module_type: 0 as const,
  dc_ac_ratio: 1.0,
  losses_percent: 2,
  inv_eff: 96,
  gcr: 0.4,
} as const

/** Modeled annual AC (kWh) should land between minOffset and maxOffset × annual usage (kWh). */
export const USAGE_OFFSET_BAND = {
  min: 0.75,
  max: 1.25,
  /** Iterative sizing aims here (center of band). */
  target: 1.0,
} as const

/** Reported system size is always a multiple of this (kWdc). */
export const SYSTEM_SIZE_STEP_KW = 5

const MIN_SYSTEM_KW = SYSTEM_SIZE_STEP_KW
const MAX_SYSTEM_KW = 500

export function snapSystemKwToStep(kw: number, stepKw: number = SYSTEM_SIZE_STEP_KW): number {
  const s = Math.max(stepKw, Math.round(kw / stepKw) * stepKw)
  return Math.min(MAX_SYSTEM_KW, Math.max(MIN_SYSTEM_KW, s))
}

/**
 * NREL PVWatts is called directly from the browser in every environment (local `npm run dev`,
 * `vite preview`, and static hosting). The API sends permissive CORS headers, so a dev proxy
 * is not required—same behavior locally and on your staging/production origin.
 *
 * Set `VITE_NREL_API_BASE` only if you intentionally front the API (e.g. future `https://developer.nlr.gov`).
 * Must be an absolute URL (https://…), **origin only** (no `/api/...` path — that is appended automatically).
 */
const NREL_API_ORIGIN_DEFAULT = 'https://developer.nrel.gov'

function normalizeNrelApiOrigin(raw: string | undefined): string {
  let base = (raw?.trim() || NREL_API_ORIGIN_DEFAULT).replace(/\/$/, '')
  // Avoid https://developer.nrel.gov/api → …/api/api/pvwatts/…
  base = base.replace(/\/api\/?$/i, '')
  if (!/^https?:\/\//i.test(base)) {
    console.warn(
      '[pvwatts] VITE_NREL_API_BASE must be an absolute URL (https://…); using https://developer.nrel.gov',
    )
    return NREL_API_ORIGIN_DEFAULT
  }
  return base
}

function nrelApiOriginConfigured(): string {
  return normalizeNrelApiOrigin(import.meta.env.VITE_NREL_API_BASE)
}

function pvwattsBodyParseFailed(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return (
    msg.includes('HTML instead of JSON') ||
    msg.includes('not valid JSON') ||
    msg.includes('Unexpected token')
  )
}

export type PvwattsRequestParams = {
  lat: number
  lon: number
  system_capacity_kw: number
  array_type?: 0 | 1 | 2 | 3 | 4
  module_type?: 0 | 1 | 2
  losses_percent?: number
  azimuth_deg?: number
  tilt_deg?: number
  dc_ac_ratio?: number
  inv_eff?: number
  gcr?: number
}

function originsEqual(a: string, b: string): boolean {
  try {
    return new URL(a).origin === new URL(b).origin
  } catch {
    return false
  }
}

export async function fetchPvwattsV8AcAnnual(
  params: PvwattsRequestParams,
): Promise<{ ac_annual_kwh: number; capacity_factor?: number }> {
  const apiKey = import.meta.env.VITE_NREL_API_KEY ?? 'DEMO_KEY'
  const sam = SAM_PVWATTS_INPUTS

  function buildUrl(origin: string): URL {
    const o = normalizeNrelApiOrigin(origin)
    const u = new URL(`${o}/api/pvwatts/v8.json`)
    u.searchParams.set('api_key', apiKey)
    u.searchParams.set('lat', String(params.lat))
    u.searchParams.set('lon', String(params.lon))
    u.searchParams.set('system_capacity', String(params.system_capacity_kw))
    u.searchParams.set('module_type', String(params.module_type ?? sam.module_type))
    u.searchParams.set('losses', String(params.losses_percent ?? sam.losses_percent))
    u.searchParams.set('array_type', String(params.array_type ?? sam.array_type))
    u.searchParams.set('tilt', String(params.tilt_deg ?? sam.tilt_deg))
    u.searchParams.set('azimuth', String(params.azimuth_deg ?? sam.azimuth_deg))
    u.searchParams.set('dc_ac_ratio', String(params.dc_ac_ratio ?? sam.dc_ac_ratio))
    u.searchParams.set('inv_eff', String(params.inv_eff ?? sam.inv_eff))
    u.searchParams.set('gcr', String(params.gcr ?? sam.gcr))
    u.searchParams.set('dataset', 'nsrdb')
    u.searchParams.set('radius', '0')
    u.searchParams.set('timeframe', 'monthly')
    return u
  }

  async function requestOnce(origin: string): Promise<{ ac_annual_kwh: number; capacity_factor?: number }> {
    const u = buildUrl(origin)
    const res = await fetch(u.toString())
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`PVWatts request failed (${res.status}) ${text.slice(0, 200)}`)
    }

    const json = await readJsonResponse<PvwattsV8Response>(res, 'PVWatts')
    if (json.errors?.length) {
      throw new Error(json.errors.join('; '))
    }

    const ac = json.outputs?.ac_annual
    if (ac == null || Number.isNaN(ac)) {
      throw new Error('PVWatts response missing ac_annual')
    }

    return {
      ac_annual_kwh: ac,
      capacity_factor: json.outputs?.capacity_factor,
    }
  }

  const configured = nrelApiOriginConfigured()
  try {
    return await requestOnce(configured)
  } catch (e) {
    if (!originsEqual(configured, NREL_API_ORIGIN_DEFAULT) && pvwattsBodyParseFailed(e)) {
      console.warn(
        '[pvwatts] Custom VITE_NREL_API_BASE returned non-JSON; retrying official NREL host once.',
      )
      return await requestOnce(NREL_API_ORIGIN_DEFAULT)
    }
    throw e
  }
}

/**
 * First-pass kWdc guess for 2-axis: higher yield than fixed roof; scale with annual usage.
 * Returned value is snapped to {@link SYSTEM_SIZE_STEP_KW}.
 */
export function initialSystemKwFromAnnualUsage(annualUsageKwh: number): number {
  const guessYield = 2400
  const raw = annualUsageKwh / guessYield
  const floatKw = Math.min(MAX_SYSTEM_KW, Math.max(0.05, raw))
  return snapSystemKwToStep(floatKw)
}

function inUsageBand(acAnnualKwh: number, annualUsageKwh: number): boolean {
  const r = acAnnualKwh / annualUsageKwh
  return r >= USAGE_OFFSET_BAND.min && r <= USAGE_OFFSET_BAND.max
}

/**
 * Adjust system_capacity until PVWatts ac_annual is within [75%, 125%] of annual usage,
 * targeting ~100% offset. Sizes are **multiples of {@link SYSTEM_SIZE_STEP_KW}** kWdc.
 */
export async function sizePvwattsToUsageBand(input: {
  lat: number
  lon: number
  annualUsageKwh: number
  maxIterations?: number
}): Promise<{
  system_capacity_kw: number
  ac_annual_kwh: number
  capacity_factor?: number
  estimateSource: 'pvwatts' | 'model'
}> {
  const annual = Math.max(1, input.annualUsageKwh)

  if (shouldUseLocalPvwattsEstimate()) {
    return sizeProductionEstimateLocal({ annualUsageKwh: annual })
  }

  try {
    const sized = await sizePvwattsToUsageBandViaApi(input)
    return { ...sized, estimateSource: 'pvwatts' as const }
  } catch (e) {
    console.warn('[pvwatts] API sizing failed; using local production model.', e)
    return sizeProductionEstimateLocal({ annualUsageKwh: annual })
  }
}

async function sizePvwattsToUsageBandViaApi(input: {
  lat: number
  lon: number
  annualUsageKwh: number
  maxIterations?: number
}): Promise<{
  system_capacity_kw: number
  ac_annual_kwh: number
  capacity_factor?: number
}> {
  const annual = Math.max(1, input.annualUsageKwh)
  const { target } = USAGE_OFFSET_BAND
  const maxIter = input.maxIterations ?? 8

  let kw = initialSystemKwFromAnnualUsage(annual)

  // Float kWdc for quick convergence; PVWatts accepts fractional capacity.
  for (let i = 0; i < maxIter; i++) {
    const { ac_annual_kwh } = await fetchPvwattsV8AcAnnual({
      lat: input.lat,
      lon: input.lon,
      system_capacity_kw: kw,
    })
    if (inUsageBand(ac_annual_kwh, annual)) {
      break
    }
    kw *= (target * annual) / Math.max(1, ac_annual_kwh)
    kw = Math.min(MAX_SYSTEM_KW, Math.max(0.05, kw))
  }

  let finalKw = snapSystemKwToStep(kw)
  let { ac_annual_kwh, capacity_factor } = await fetchPvwattsV8AcAnnual({
    lat: input.lat,
    lon: input.lon,
    system_capacity_kw: finalKw,
  })
  let lastAc = ac_annual_kwh
  let lastCf = capacity_factor

  let guard = 0
  while (!inUsageBand(ac_annual_kwh, annual) && guard++ < 120) {
    const ratio = ac_annual_kwh / annual
    if (ratio > USAGE_OFFSET_BAND.max && finalKw > MIN_SYSTEM_KW) {
      finalKw -= SYSTEM_SIZE_STEP_KW
    } else if (ratio < USAGE_OFFSET_BAND.min && finalKw < MAX_SYSTEM_KW) {
      finalKw += SYSTEM_SIZE_STEP_KW
    } else {
      break
    }
    const next = await fetchPvwattsV8AcAnnual({
      lat: input.lat,
      lon: input.lon,
      system_capacity_kw: finalKw,
    })
    ac_annual_kwh = next.ac_annual_kwh
    capacity_factor = next.capacity_factor
    lastAc = ac_annual_kwh
    lastCf = capacity_factor
  }

  return {
    system_capacity_kw: finalKw,
    ac_annual_kwh: lastAc,
    capacity_factor: lastCf,
  }
}
