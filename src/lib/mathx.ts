/**
 * Local math helpers that mirror three's `MathUtils` exactly.
 *
 * The scroll/day-cycle config utilities only needed a handful of `MathUtils`
 * functions, but importing anything from "three" pulls the entire ~350 KB
 * module into whatever chunk uses it. Those config files load eagerly on the
 * homepage, so that dragged three.js onto the mobile initial load even though
 * phones render a static hero poster. These 1:1 replacements keep three.js out
 * of that path entirely. Signatures/behaviour match THREE.MathUtils.
 */

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const lerp = (x: number, y: number, t: number): number =>
  (1 - t) * x + t * y;

export const radToDeg = (radians: number): number => (radians * 180) / Math.PI;

export const euclideanModulo = (n: number, m: number): number =>
  ((n % m) + m) % m;

export function smoothstep(x: number, min: number, max: number): number {
  if (x <= min) return 0;
  if (x >= max) return 1;
  x = (x - min) / (max - min);
  return x * x * (3 - 2 * x);
}

export function smootherstep(x: number, min: number, max: number): number {
  if (x <= min) return 0;
  if (x >= max) return 1;
  x = (x - min) / (max - min);
  return x * x * x * (x * (x * 6 - 15) + 10);
}
