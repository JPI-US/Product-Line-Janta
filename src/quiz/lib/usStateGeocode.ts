/**
 * Open-Meteo’s fuzzy search returns irrelevant first hits for some queries (e.g. “Texas” → Colfax, WV).
 * We resolve whole-state queries and map regions for “City, ST” matching using fixed US centroids
 * (geographic centers, ~USGS-style) plus standard abbreviations.
 */

export type UsStateCentroid = {
  /** GeoNames-style admin1 string as returned for US cities in that state */
  admin1: string
  label: string
  lat: number
  lon: number
}

/** Geographic center lat/lon per state (approximate). */
export const US_STATE_CENTROIDS: UsStateCentroid[] = [
  { admin1: 'Alabama', label: 'Alabama, United States', lat: 32.7794, lon: -86.8287 },
  { admin1: 'Alaska', label: 'Alaska, United States', lat: 64.0685, lon: -152.2782 },
  { admin1: 'Arizona', label: 'Arizona, United States', lat: 34.2744, lon: -111.6602 },
  { admin1: 'Arkansas', label: 'Arkansas, United States', lat: 34.8938, lon: -92.4426 },
  { admin1: 'California', label: 'California, United States', lat: 37.1841, lon: -119.4696 },
  { admin1: 'Colorado', label: 'Colorado, United States', lat: 38.9972, lon: -105.5478 },
  { admin1: 'Connecticut', label: 'Connecticut, United States', lat: 41.6219, lon: -72.7273 },
  { admin1: 'Delaware', label: 'Delaware, United States', lat: 38.9896, lon: -75.505 },
  { admin1: 'Florida', label: 'Florida, United States', lat: 28.6305, lon: -82.4497 },
  { admin1: 'Georgia', label: 'Georgia, United States', lat: 32.6415, lon: -83.4426 },
  { admin1: 'Hawaii', label: 'Hawaii, United States', lat: 20.2927, lon: -156.3737 },
  { admin1: 'Idaho', label: 'Idaho, United States', lat: 44.3509, lon: -114.613 },
  { admin1: 'Illinois', label: 'Illinois, United States', lat: 40.0417, lon: -89.1965 },
  { admin1: 'Indiana', label: 'Indiana, United States', lat: 39.8942, lon: -86.2816 },
  { admin1: 'Iowa', label: 'Iowa, United States', lat: 42.0751, lon: -93.496 },
  { admin1: 'Kansas', label: 'Kansas, United States', lat: 38.4937, lon: -98.3804 },
  { admin1: 'Kentucky', label: 'Kentucky, United States', lat: 37.5347, lon: -85.3021 },
  { admin1: 'Louisiana', label: 'Louisiana, United States', lat: 31.0689, lon: -91.9968 },
  { admin1: 'Maine', label: 'Maine, United States', lat: 45.3695, lon: -69.2428 },
  { admin1: 'Maryland', label: 'Maryland, United States', lat: 39.055, lon: -76.7909 },
  { admin1: 'Massachusetts', label: 'Massachusetts, United States', lat: 42.2596, lon: -71.8083 },
  { admin1: 'Michigan', label: 'Michigan, United States', lat: 44.3467, lon: -85.4102 },
  { admin1: 'Minnesota', label: 'Minnesota, United States', lat: 46.2807, lon: -94.3053 },
  { admin1: 'Mississippi', label: 'Mississippi, United States', lat: 32.7364, lon: -89.6678 },
  { admin1: 'Missouri', label: 'Missouri, United States', lat: 38.3566, lon: -92.458 },
  { admin1: 'Montana', label: 'Montana, United States', lat: 47.0527, lon: -109.6333 },
  { admin1: 'Nebraska', label: 'Nebraska, United States', lat: 41.5378, lon: -99.7951 },
  { admin1: 'Nevada', label: 'Nevada, United States', lat: 39.3289, lon: -116.6312 },
  { admin1: 'New Hampshire', label: 'New Hampshire, United States', lat: 43.6805, lon: -71.5811 },
  { admin1: 'New Jersey', label: 'New Jersey, United States', lat: 40.1907, lon: -74.6728 },
  { admin1: 'New Mexico', label: 'New Mexico, United States', lat: 34.4071, lon: -106.1126 },
  { admin1: 'New York', label: 'New York, United States', lat: 42.9538, lon: -75.5268 },
  { admin1: 'North Carolina', label: 'North Carolina, United States', lat: 35.5557, lon: -79.3877 },
  { admin1: 'North Dakota', label: 'North Dakota, United States', lat: 47.4501, lon: -100.4659 },
  { admin1: 'Ohio', label: 'Ohio, United States', lat: 40.2862, lon: -82.7937 },
  { admin1: 'Oklahoma', label: 'Oklahoma, United States', lat: 35.5889, lon: -97.4943 },
  { admin1: 'Oregon', label: 'Oregon, United States', lat: 43.9336, lon: -120.5583 },
  { admin1: 'Pennsylvania', label: 'Pennsylvania, United States', lat: 40.8781, lon: -77.7996 },
  { admin1: 'Rhode Island', label: 'Rhode Island, United States', lat: 41.6772, lon: -71.5101 },
  { admin1: 'South Carolina', label: 'South Carolina, United States', lat: 33.8191, lon: -80.9066 },
  { admin1: 'South Dakota', label: 'South Dakota, United States', lat: 44.2853, lon: -99.4632 },
  { admin1: 'Tennessee', label: 'Tennessee, United States', lat: 35.7449, lon: -86.7489 },
  { admin1: 'Texas', label: 'Texas, United States', lat: 31.106, lon: -97.6475 },
  { admin1: 'Utah', label: 'Utah, United States', lat: 40.1135, lon: -111.8535 },
  { admin1: 'Vermont', label: 'Vermont, United States', lat: 44.0459, lon: -72.7107 },
  { admin1: 'Virginia', label: 'Virginia, United States', lat: 37.768, lon: -78.2057 },
  { admin1: 'Washington', label: 'Washington, United States', lat: 47.7511, lon: -120.7401 },
  { admin1: 'West Virginia', label: 'West Virginia, United States', lat: 38.4912, lon: -81.9545 },
  { admin1: 'Wisconsin', label: 'Wisconsin, United States', lat: 44.2685, lon: -89.6165 },
  { admin1: 'Wyoming', label: 'Wyoming, United States', lat: 43.0, lon: -107.5452 },
  { admin1: 'District of Columbia', label: 'Washington, DC, United States', lat: 38.8977, lon: -77.0365 },
]

const ABBREV_TO_ADMIN1: Record<string, string> = {
  al: 'Alabama',
  ak: 'Alaska',
  az: 'Arizona',
  ar: 'Arkansas',
  ca: 'California',
  co: 'Colorado',
  ct: 'Connecticut',
  de: 'Delaware',
  dc: 'District of Columbia',
  fl: 'Florida',
  ga: 'Georgia',
  hi: 'Hawaii',
  id: 'Idaho',
  il: 'Illinois',
  in: 'Indiana',
  ia: 'Iowa',
  ks: 'Kansas',
  ky: 'Kentucky',
  la: 'Louisiana',
  me: 'Maine',
  md: 'Maryland',
  ma: 'Massachusetts',
  mi: 'Michigan',
  mn: 'Minnesota',
  ms: 'Mississippi',
  mo: 'Missouri',
  mt: 'Montana',
  ne: 'Nebraska',
  nv: 'Nevada',
  nh: 'New Hampshire',
  nj: 'New Jersey',
  nm: 'New Mexico',
  ny: 'New York',
  nc: 'North Carolina',
  nd: 'North Dakota',
  oh: 'Ohio',
  ok: 'Oklahoma',
  or: 'Oregon',
  pa: 'Pennsylvania',
  ri: 'Rhode Island',
  sc: 'South Carolina',
  sd: 'South Dakota',
  tn: 'Tennessee',
  tx: 'Texas',
  ut: 'Utah',
  vt: 'Vermont',
  va: 'Virginia',
  wa: 'Washington',
  wv: 'West Virginia',
  wi: 'Wisconsin',
  wy: 'Wyoming',
}

const ADMIN1_TO_ROW = new Map<string, UsStateCentroid>(
  US_STATE_CENTROIDS.map((r) => [r.admin1.toLowerCase(), r]),
)

function normalizeQuery(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
}

/** Whole query is a US state name or 2-letter abbreviation → centroid (avoids bad Open-Meteo fuzzy hits). */
export function resolveUsStateOnlyQuery(query: string): { lat: number; lon: number; label: string } | null {
  const n = normalizeQuery(query)
  if (n.length < 2) return null

  if (n.length === 2) {
    const admin1 = ABBREV_TO_ADMIN1[n]
    if (!admin1) return null
    const row = ADMIN1_TO_ROW.get(admin1.toLowerCase())
    return row ? { lat: row.lat, lon: row.lon, label: row.label } : null
  }

  if (n === 'washington dc' || n === 'washington d c' || n === 'dc') {
    const row = ADMIN1_TO_ROW.get('district of columbia')
    return row ? { lat: row.lat, lon: row.lon, label: row.label } : null
  }

  const row = ADMIN1_TO_ROW.get(n)
  return row ? { lat: row.lat, lon: row.lon, label: row.label } : null
}

/** Map trailing region in “City, TX” / “City, Texas” to Open-Meteo admin1 string. */
export function expandUsRegionToAdmin1(region: string): string | null {
  const t = region.trim()
  if (!t) return null
  const n = normalizeQuery(t)
  if (n.length === 2) {
    return ABBREV_TO_ADMIN1[n] ?? null
  }
  if (ADMIN1_TO_ROW.has(n)) {
    return ADMIN1_TO_ROW.get(n)!.admin1
  }
  if (n === 'washington dc' || n === 'dc') return 'District of Columbia'
  return null
}

export function admin1Matches(a: string | undefined, targetAdmin1: string): boolean {
  if (!a) return false
  return a.trim().toLowerCase() === targetAdmin1.trim().toLowerCase()
}
