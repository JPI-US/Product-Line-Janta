import { defineConfig } from "@playwright/test";

/**
 * Visual regression for the tower scenes. Run with `npm run test:visual`
 * (builds first — screenshots are taken against the production preview so
 * baselines are stable across dev-server refactors).
 *
 * Baselines live in tests/towers.spec.ts-snapshots/. Refresh intentionally
 * with `npm run test:visual -- --update-snapshots`.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: {
    toMatchSnapshot: {
      // Software WebGL rasterization drifts a little between runs
      maxDiffPixelRatio: 0.02,
    },
  },
  use: {
    baseURL: "http://localhost:8091",
    viewport: { width: 1280, height: 800 },
    launchOptions: {
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    },
  },
  webServer: {
    command: "npx vite preview --port 8091 --strictPort",
    url: "http://localhost:8091",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
