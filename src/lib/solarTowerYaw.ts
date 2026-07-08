/**
 * Designer tower PV array outward normal in XZ when rotation.y = 0.
 * Measured from 5.6k web GLB — panels face roughly -Z in export space.
 */
export const DESIGNER_PV_NORMAL_YAW = Math.PI;

/**
 * Y rotation so vertical PV faces toward solar azimuth (0° = north, clockwise).
 */
export function getTowerYawFromSolarAzimuthDegrees(
  azimuthDeg: number,
  panelNormalYawAtZero: number = DESIGNER_PV_NORMAL_YAW
): number {
  const az = (azimuthDeg * Math.PI) / 180;
  const sunX = Math.sin(az);
  const sunZ = Math.cos(az);
  const n0x = Math.sin(panelNormalYawAtZero);
  const n0z = Math.cos(panelNormalYawAtZero);
  return Math.atan2(sunX * n0z - sunZ * n0x, sunZ * n0z + sunX * n0x);
}

/** Azimuth (degrees) from a horizontal direction in world XZ. */
export function solarAzimuthDegFromDirection(dx: number, dz: number): number {
  let deg = (Math.atan2(dx, dz) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

/** Horizontal solar azimuth from the direction the tower panels face at `yaw`. */
export function solarAzimuthDegFromTowerYaw(
  yaw: number,
  panelNormalYawAtZero: number = DESIGNER_PV_NORMAL_YAW
): number {
  const n0x = Math.sin(panelNormalYawAtZero);
  const n0z = Math.cos(panelNormalYawAtZero);
  const nx = n0x * Math.cos(yaw) + n0z * Math.sin(yaw);
  const nz = -n0x * Math.sin(yaw) + n0z * Math.cos(yaw);
  return solarAzimuthDegFromDirection(nx, nz);
}
