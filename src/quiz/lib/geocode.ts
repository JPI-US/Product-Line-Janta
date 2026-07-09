import {
  admin1Matches,
  expandUsRegionToAdmin1,
  resolveUsStateOnlyQuery,
} from './usStateGeocode'
import { readJsonResponse } from './readJsonResponse'

/** Open-Meteo geocoding — browser-friendly, no API key. */
export type GeocodeHit = { lat: number; lon: number; label: string }

type OmHit = {
  latitude: number
  longitude: number
  name: string
  admin1?: string
  country?: string
  population?: number
}

function stripTrailingCountry(q: string): string {
  return q.replace(/,?\s*(usa|united states|u\.s\.a\.?)\s*$/i, '').trim()
}

function formatLabel(hit: OmHit): string {
  return [hit.name, hit.admin1, hit.country].filter(Boolean).join(', ')
}

async function openMeteoSearch(
  name: string,
  opts: { countryCode?: string; count?: number },
): Promise<OmHit[]> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', name)
  url.searchParams.set('count', String(opts.count ?? 25))
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')
  if (opts.countryCode) url.searchParams.set('countryCode', opts.countryCode)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`)
  const data = await readJsonResponse<{ results?: OmHit[] }>(res, 'Geocoding')
  return data.results ?? []
}

function pickBestGeneralHit(hits: OmHit[], query: string): OmHit | null {
  if (!hits.length) return null
  const q = query.trim().toLowerCase()
  const exactMatches = hits.filter((h) => h.name.toLowerCase() === q)
  const pool = exactMatches.length ? exactMatches : hits
  const sorted = [...pool].sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
  return sorted[0] ?? null
}

/** “Austin, Texas” / “Austin, TX” — Open-Meteo rejects some comma queries; search city and filter by state. */
async function geocodeCityCommaRegion(query: string): Promise<GeocodeHit | null> {
  const idx = query.indexOf(',')
  if (idx === -1) return null
  const city = query.slice(0, idx).trim()
  const region = query.slice(idx + 1).trim()
  if (city.length < 2 || region.length < 1) return null

  const admin1 = expandUsRegionToAdmin1(region)
  if (!admin1) return null

  let hits = await openMeteoSearch(city, { countryCode: 'US', count: 25 })
  let inState = hits.filter((h) => admin1Matches(h.admin1, admin1))
  if (!inState.length) {
    hits = await openMeteoSearch(city, { count: 25 })
    inState = hits.filter((h) => admin1Matches(h.admin1, admin1))
  }
  if (!inState.length) return null

  inState.sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
  const best = inState[0]!
  return {
    lat: best.latitude,
    lon: best.longitude,
    label: formatLabel(best),
  }
}

/** Address suggestions for autocomplete — Open-Meteo geocoding, no API key. */
export async function searchAddressSuggestions(
  query: string,
  limit = 6,
): Promise<GeocodeHit[]> {
  const q = stripTrailingCountry(query.trim())
  if (q.length < 3) return []

  let hits = await openMeteoSearch(q, { countryCode: 'US', count: limit })
  if (!hits.length) {
    hits = await openMeteoSearch(q, { count: limit })
  }

  const seen = new Set<string>()
  const results: GeocodeHit[] = []
  for (const hit of hits) {
    const label = formatLabel(hit)
    if (seen.has(label)) continue
    seen.add(label)
    results.push({ lat: hit.latitude, lon: hit.longitude, label })
  }
  return results
}

export async function geocodeAddress(query: string): Promise<GeocodeHit | null> {
  const q0 = query.trim()
  if (q0.length < 2) return null

  const q = stripTrailingCountry(q0)

  // Two-letter US state → centroid (Open-Meteo is unreliable for e.g. "TX" alone).
  if (q.length === 2) {
    const only = resolveUsStateOnlyQuery(q)
    return only ? { lat: only.lat, lon: only.lon, label: only.label } : null
  }

  if (q.length < 3) return null

  const stateOnly = resolveUsStateOnlyQuery(q)
  if (stateOnly) {
    return { lat: stateOnly.lat, lon: stateOnly.lon, label: stateOnly.label }
  }

  const commaHit = await geocodeCityCommaRegion(q)
  if (commaHit) return commaHit

  let hits = await openMeteoSearch(q, { countryCode: 'US', count: 25 })
  if (!hits.length) {
    hits = await openMeteoSearch(q, { count: 25 })
  }
  const best = pickBestGeneralHit(hits, q)
  if (!best) return null
  return { lat: best.latitude, lon: best.longitude, label: formatLabel(best) }
}
