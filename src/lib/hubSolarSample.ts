import { HUB_TOWER } from "../components/three/hubTowerConfig";
import { getSunPositionDegrees } from "./solarAzimuth";

export type HubSolarCoords = { lat: number; lon: number };

const FALLBACK_SUN = {
  azimuthDeg: HUB_TOWER.defaultAzimuthDeg,
  altitudeDeg: 38,
};

/** Sun position for hub tower + sky — uses preview time when set, otherwise `at`. */
export function sampleHubSun(
  coords: HubSolarCoords | null,
  previewDate?: Date | null,
  at: Date = new Date()
) {
  const when = previewDate ?? at;
  if (coords == null) return FALLBACK_SUN;
  return getSunPositionDegrees(coords.lat, coords.lon, when);
}
