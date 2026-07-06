/** Virtual demo system — admin-only marketing / sales showcase (ported from Portal). */

export const MARKETING_SYSTEM_ID = 99998;

/** Generic 15 kW reference install (3 × ~5 kW towers). */
export const GENERIC_SOLAR_KW = 15;

export const MARKETING_TOWER_COUNT = 3;

export const MARKETING_SYSTEM = {
  id: MARKETING_SYSTEM_ID,
  system_name: "Marketing",
  timezone: "America/Chicago",
  status: "ACTIVE",
  max_pv_kw: GENERIC_SOLAR_KW,
  latitude: 32.7767,
  longitude: -96.797,
  has_fronius_system: false,
} as const;

export function isMarketingId(systemId: unknown) {
  return Number(systemId) === MARKETING_SYSTEM_ID;
}

export function marketingSystemPayload() {
  return {
    id: MARKETING_SYSTEM_ID,
    system_name: MARKETING_SYSTEM.system_name,
    towers: [
      { id: 98001, model: "TR-08", order_id: 1, state: 1, tower_angle: 142.5 },
      { id: 98002, model: "TR-08", order_id: 2, state: 1, tower_angle: 156.0 },
      { id: 98003, model: "TR-08", order_id: 3, state: 1, tower_angle: 138.2 },
    ],
    timezone: MARKETING_SYSTEM.timezone,
    max_pv_kw: MARKETING_SYSTEM.max_pv_kw,
    total_towers: MARKETING_TOWER_COUNT,
    latitude: MARKETING_SYSTEM.latitude,
    longitude: MARKETING_SYSTEM.longitude,
  };
}
