/**
 * Generates web GLB assets from the CAD exports (single file, fewer triangles).
 * Requires TR-08-001.gltf + .bin files in public/models/tr-08-001/.
 *
 * Run: npm run optimize:models
 */
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const jobs = [
  {
    label: "utility",
    input: path.join(root, "public/models/tr-08-001/TR-08-001.gltf"),
    output: path.join(root, "public/models/tr-08-001/TR-08-001-web.glb"),
  },
  {
    label: "designer",
    input: path.join(root, "public/models/5.6k_10x4_panels/5.6k_10x4_panels.gltf"),
    output: path.join(
      root,
      "public/models/5.6k_10x4_panels/5.6k_10x4_panels-web.glb"
    ),
  },
];

for (const { label, input, output } of jobs) {
  console.log(`\nOptimizing ${label}…`);
  execSync(
    `npx gltf-transform optimize "${input}" "${output}" --compress false --texture-compress false --join false --instance false --flatten false --palette false`,
    { stdio: "inherit", cwd: root }
  );
}

console.log("\nBaking utility ready GLB (merged meshes)…");
execSync("npx tsx scripts/bake-utility-ready.ts", { stdio: "inherit", cwd: root });

console.log("\nBaking designer ready GLB (merged meshes)…");
execSync("npx tsx scripts/bake-designer-ready.ts", { stdio: "inherit", cwd: root });

console.log(
  "\nDone. Designer: *-ready.glb | Utility: TR-08-001-ready.glb (plus *-web.glb)"
);
