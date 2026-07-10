/**
 * Hue-space colour interpolation that reproduces three's `Color` exactly, so
 * the website day-cycle sky gradients look identical without importing three.
 *
 * three has ColorManagement enabled by default (r152+): `new Color('#rrggbb')`
 * decodes sRGB → linear, `getHSL`/`setHSL` operate in that linear working space,
 * and `getHexString` encodes linear → sRGB. We mirror that pipeline precisely
 * (verified channel-for-channel against three) so there is no visual drift.
 */

// three's SRGBToLinear / LinearToSRGB (ColorManagement.js).
const srgbToLinear = (c: number): number =>
  c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);

const linearToSrgb = (c: number): number =>
  c < 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 0.41666) - 0.055;

// three's Color.setHSL hue helper.
function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * 6 * (2 / 3 - t);
  return p;
}

type Hsl = { h: number; s: number; l: number };

/** hex sRGB string → HSL of the linear-space colour (matches Color.getHSL). */
function hexToLinearHsl(hex: string): Hsl {
  const n = parseInt(hex.slice(1), 16);
  const r = srgbToLinear(((n >> 16) & 255) / 255);
  const g = srgbToLinear(((n >> 8) & 255) / 255);
  const b = srgbToLinear((n & 255) / 255);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (min + max) / 2;
  let h = 0;
  let s = 0;
  if (min !== max) {
    const delta = max - min;
    s = l <= 0.5 ? delta / (max + min) : delta / (2 - max - min);
    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
        break;
    }
    h /= 6;
  }
  return { h, s, l };
}

/** HSL (linear space) → hex sRGB string (matches Color.setHSL + getHexString). */
function linearHslToHex(h: number, s: number, l: number): string {
  h = ((h % 1) + 1) % 1;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const p = l <= 0.5 ? l * (1 + s) : l + s - l * s;
    const q = 2 * l - p;
    r = hue2rgb(q, p, h + 1 / 3);
    g = hue2rgb(q, p, h);
    b = hue2rgb(q, p, h - 1 / 3);
  }
  const to255 = (c: number) =>
    Math.round(Math.max(0, Math.min(255, linearToSrgb(c) * 255)));
  const hex = ((to255(r) << 16) | (to255(g) << 8) | to255(b))
    .toString(16)
    .padStart(6, "0");
  return `#${hex}`;
}

/** Interpolate two hex colours through HSL, matching the previous three.Color path. */
export function lerpHexHsl(a: string, b: string, t: number): string {
  const ha = hexToLinearHsl(a);
  const hb = hexToLinearHsl(b);

  let dh = hb.h - ha.h;
  if (dh > 0.5) dh -= 1;
  if (dh < -0.5) dh += 1;

  return linearHslToHex(
    (ha.h + dh * t + 1) % 1,
    ha.s + (hb.s - ha.s) * t,
    ha.l + (hb.l - ha.l) * t,
  );
}
