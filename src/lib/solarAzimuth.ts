/** Solar azimuth (compass degrees, 0° = north, clockwise). Based on SunCalc (MIT). */

const PI = Math.PI;
const rad = PI / 180;
const dayMs = 86_400_000;
const J1970 = 2440588;
const J2000 = 2451545;
const obliquity = rad * 23.4397;

function toJulian(date: Date) {
  return date.valueOf() / dayMs - 0.5 + J1970;
}

function toDays(date: Date) {
  return toJulian(date) - J2000;
}

function rightAscension(l: number) {
  return Math.atan2(Math.sin(l) * Math.cos(obliquity), Math.cos(l));
}

function declination(l: number) {
  return Math.asin(Math.sin(obliquity) * Math.sin(l));
}

function solarMeanAnomaly(d: number) {
  return rad * (357.5291 + 0.98560028 * d);
}

function eclipticLongitude(M: number) {
  const C =
    rad *
    (1.9148 * Math.sin(M) +
      0.02 * Math.sin(2 * M) +
      0.0003 * Math.sin(3 * M));
  const P = rad * 102.9372;
  return M + C + P + PI;
}

function siderealTime(d: number, lw: number) {
  return rad * (280.16 + 360.9856235 * d) - lw;
}

export type SunPositionDegrees = {
  /** Compass degrees from north, clockwise (0–360) */
  azimuthDeg: number;
  /** Degrees above the horizon (negative = below) */
  altitudeDeg: number;
};

function getSunAnglesRad(lat: number, lng: number, date: Date) {
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(date);
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);
  const dec = declination(L);
  const H = siderealTime(d, lw) - rightAscension(L);
  return { phi, dec, H };
}

/** Sun azimuth in degrees from north (0–360°, clockwise). */
export function getSunAzimuthDegrees(
  lat: number,
  lng: number,
  date = new Date()
): number {
  return getSunPositionDegrees(lat, lng, date).azimuthDeg;
}

/** Azimuth + altitude for hub sky placement and tower tracking. */
export function getSunPositionDegrees(
  lat: number,
  lng: number,
  date = new Date()
): SunPositionDegrees {
  const { phi, dec, H } = getSunAnglesRad(lat, lng, date);
  const altitude = Math.asin(
    Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)
  );
  const azimuth = Math.atan2(
    Math.sin(H),
    Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)
  );
  let azimuthDeg = (azimuth / rad + 180) % 360;
  if (azimuthDeg < 0) azimuthDeg += 360;
  return {
    azimuthDeg,
    altitudeDeg: altitude / rad,
  };
}
