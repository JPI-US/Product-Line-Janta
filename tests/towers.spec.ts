import { expect, test } from "@playwright/test";

/**
 * Tower screenshot regression — one baseline per orbit angle per product.
 * The orbit viewer is deterministic when auto-rotate/sway are frozen via
 * prefers-reduced-motion, so these catch material/lighting/mesh regressions.
 */

const PRODUCTS = ["designer", "utility"] as const;
const ANGLES = ["Front", "Side", "Back"] as const;

// Freeze auto-rotate/sway/sun-arc. Note: the `reducedMotion` context option
// does not reach the page in this setup — emulateMedia per-test does.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const product of PRODUCTS) {
  test.describe(`${product} tower`, () => {
    for (const angle of ANGLES) {
      test(`${angle} view`, async ({ page }) => {
        await page.goto(`/orbit/${product}`);
        // Wait for the full-res tier (not the -lod2 stand-in) so the
        // progressive swap has happened before we frame the shot.
        await page.waitForResponse(
          (r) => r.url().endsWith("-ready.glb") && r.status() === 200,
          { timeout: 60_000 },
        );
        // Environment HDR + decoders come from CDNs — wait for them too,
        // otherwise env lighting flips between runs.
        await page.waitForLoadState("networkidle", { timeout: 60_000 });
        await page.waitForTimeout(3_000);
        await page.getByRole("button", { name: angle, exact: true }).click();
        // Waypoint tween is skipped under reduced motion; give the renderer
        // a few frames to settle on the new camera pose.
        await page.waitForTimeout(4_000);
        // Single-shot compare: toHaveScreenshot's stability loop never
        // converges while the WebGL canvas repaints every frame.
        const shot = await page.screenshot({ animations: "disabled" });
        expect(shot).toMatchSnapshot(`${product}-${angle.toLowerCase()}.png`);
      });
    }
  });
}
