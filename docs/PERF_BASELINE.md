# Performance baseline

Recorded July 8, 2026, after completing the 13-stage 3D plan (compression,
loading UX, interactivity, visual quality, post-FX, progressive LOD, tooling).

## Model weights (total download, single-file GLBs)

| Asset | Before | After | LOD1 | LOD2 |
|---|---|---|---|---|
| `5.6k_10x4_panels-ready.glb` (DSR) | 5.3 MB | 670 KB | 109 KB | 50 KB |
| `TR-08-001-ready.glb` (LFM) | 6.0 MB | 818 KB | 493 KB | 270 KB |

Rebuild with `npm run compress:models` (runs automatically in `prebuild`).
Tuning lives in `scripts/compress-models.mjs` (`TUNING_OVERRIDES`): the DSR
hero keeps strict simplification to preserve the honeycomb; the LFM model and
all LOD tiers use meshopt "sloppy" simplification.

## Progressive loading

- `index.html` preloads the 50 KB DSR `-lod2` tier.
- Product pages: `ProductModelPreload` prepares the `-lod2` stand-in first;
  `ProductTowerModel` renders it and re-clones when the full mesh is ready.
- Orbit viewer: `useProgressiveModel` swaps lod2 → full, then keeps the lod2
  scene as a `THREE.LOD` far level (swap at 11 world units).

## Initial JS (route `/website`, gzip)

```
  2.6 KB  entry
  0.6 KB  preload-helper
 46.2 KB  react-vendor
  8.1 KB  router-vendor
 57.6 KB  TOTAL   (budget 250 KB — enforced by `npm run check:bundle`)
```

No `three-vendor` / `three-loaders` / `three-postfx` chunk is reachable from
the entry graph; the 3D runtime loads behind route-level dynamic imports.

## Lighthouse mobile — `/website` (headless Chromium, SwiftShader)

`docs/lighthouse-final-mobile.json` (baseline from Phase A:
`docs/lighthouse-baseline-mobile.json`).

| Metric | Baseline | Final |
|---|---|---|
| Performance score | 30 | 33 |
| First Contentful Paint | 7.1 s | 3.5 s |
| Largest Contentful Paint | — | 8.8 s |
| Total Blocking Time | 2,980 ms | 10,020 ms |
| Cumulative Layout Shift | — | 0.001 |

Caveat: this machine renders WebGL on the CPU (SwiftShader), so TBT/TTI are
dominated by software rasterization of the hero canvas and do not represent
real devices. The bundle guard above plus the network waterfall (lod2 tower
visible before the full GLB) are the meaningful regression signals in CI;
re-run Lighthouse on real hardware (PageSpeed Insights) for shippable scores.

## Visual regression

`npm run test:visual` — builds, serves `dist/` on port 8091, and compares
six orbit-viewer screenshots (DSR/LFM × Front/Side/Back) against baselines in
`tests/towers.spec.ts-snapshots/`. Refresh intentionally with
`npm run test:visual -- --update-snapshots`. Tests freeze auto-rotate/sway
via `prefers-reduced-motion` emulation and allow 2% pixel drift for software
rasterization noise.

## Dev tooling

`/dev/model-viewer` (DEV builds only): drop any `.glb`, tweak sun/ambient/
environment/exposure/roughness, toggle wireframe, export a PNG.
