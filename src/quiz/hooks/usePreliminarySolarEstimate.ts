import { useEffect, useState } from 'react'
import { geocodeAddress } from '../lib/geocode'
import { sizePvwattsToUsageBand } from '../lib/pvwatts'
import {
  computePreliminaryRoi,
  type PreliminaryRoi,
  type SavingsProjectType,
} from '../lib/roiSpreadsheet'

export type SolarEstimateState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ok'
      geocodeLabel: string
      lat: number
      lon: number
      systemCapacityKw: number
      roi: PreliminaryRoi
      estimateSource: 'pvwatts' | 'model'
    }

export function usePreliminarySolarEstimate(input: {
  enabled: boolean
  location: string
  monthlyUsageKwh: number
  monthlyBillUsd: number
  projectType: SavingsProjectType | null
}): SolarEstimateState {
  const [state, setState] = useState<SolarEstimateState>({ status: 'idle' })

  /* eslint-disable react-hooks/set-state-in-effect -- geocode + PVWatts lifecycle (idle → loading → ok/error) */
  useEffect(() => {
    if (!input.enabled) {
      setState({ status: 'idle' })
      return
    }

    let cancelled = false
    setState({ status: 'loading' })

    ;(async () => {
      try {
        if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
          setState({
            status: 'error',
            message:
              'This wizard was opened as a file (file:// in the address bar). Browsers block or break requests to geocoding and solar APIs from file pages. Run a tiny local web server instead: in the project folder use npm run dev, or npm run build then npx --yes serve dist, and open the http://localhost address it prints.',
          })
          return
        }

        const geo = await geocodeAddress(input.location)
        if (cancelled) return
        if (!geo) {
          setState({
            status: 'error',
            message:
              'Could not place that address on the map. Try adding city and ZIP, then use “Previous” to edit.',
          })
          return
        }

        const annualUsage = Math.max(1, input.monthlyUsageKwh * 12)
        const { system_capacity_kw: systemKw, ac_annual_kwh, capacity_factor, estimateSource } =
          await sizePvwattsToUsageBand({
            lat: geo.lat,
            lon: geo.lon,
            annualUsageKwh: annualUsage,
          })
        if (cancelled) return

        const roi = computePreliminaryRoi({
          monthlyUsageKwh: input.monthlyUsageKwh,
          monthlyBillUsd: input.monthlyBillUsd,
          modeledAcAnnualKwh: ac_annual_kwh,
          systemCapacityKw: systemKw,
          projectType: input.projectType,
          capacityFactorPercent: capacity_factor,
        })

        setState({
          status: 'ok',
          geocodeLabel: geo.label,
          lat: geo.lat,
          lon: geo.lon,
          systemCapacityKw: systemKw,
          roi,
          estimateSource,
        })
      } catch (e) {
        if (cancelled) return
        let msg = e instanceof Error ? e.message : 'Unknown error'
        if (
          msg === 'Failed to fetch' ||
          msg === 'NetworkError when attempting to fetch resource.' ||
          /load failed/i.test(msg) ||
          /connection failed/i.test(msg) ||
          /networkerror/i.test(msg) ||
          /failed to connect/i.test(msg)
        ) {
          msg =
            'Could not reach the geocoding or NREL solar API. Check your network, VPN, or extensions that block requests. The app must be opened over http(s) (e.g. npm run dev, npm run preview, or your staging site), not as a file:// page saved from disk.'
        }
        setState({
          status: 'error',
          message: msg,
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    input.enabled,
    input.location,
    input.monthlyUsageKwh,
    input.monthlyBillUsd,
    input.projectType,
  ])
  /* eslint-enable react-hooks/set-state-in-effect */

  return state
}
