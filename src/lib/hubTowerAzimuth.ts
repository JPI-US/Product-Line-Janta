import * as THREE from "three";
import {
  getHubTowerStowYaw,
  getHubTowerYawFromSolarAzimuth,
  getSunDirectionFromSolar,
  isHubSolarTracking,
} from "./hubSolarAlignment";

export {
  getHubTowerStowYaw,
  getHubTowerYawFromSolarAzimuth,
  isHubSolarTracking,
};

/** @deprecated Use getHubTowerYawFromSolarAzimuth */
export function getTowerYawFromSunAzimuthDegrees(azimuthDeg: number): number {
  return getHubTowerYawFromSolarAzimuth(azimuthDeg);
}

/** Direction toward the sun — uses true altitude when provided. */
export function getSunDirectionFromAzimuthDegrees(
  azimuthDeg: number,
  altitudeDeg = 35,
  target?: THREE.Vector3
) {
  return getSunDirectionFromSolar(azimuthDeg, altitudeDeg, target);
}
