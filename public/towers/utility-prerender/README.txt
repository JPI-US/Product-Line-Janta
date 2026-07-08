Utility tower prerender frames (48 WebPs + manifest.json).

Generate locally (uses Chromium + real GPU — do not use bake:utility-prerender:headless on Windows):
  npm install
  npx playwright install chromium
  npm run bake:utility-prerender

Requires TR-08-001-ready.glb (or fallback) under public/models/tr-08-001/.

After baking, hard-refresh http://localhost:5173/3d

Revert to live utility WebGL: set USE_UTILITY_PRERENDER = false in src/components/three/towerCanvasMode.ts
