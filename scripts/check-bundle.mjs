/**
 * Bundle regression guard. Run after `vite build`:
 *
 *   npm run build && node scripts/check-bundle.mjs
 *
 * Asserts:
 *  1. The initial JS graph for `/` and `/website` (entry chunk + its static
 *     import closure, i.e. everything fetched before any user interaction)
 *     does NOT include the `three-vendor` or `three-loaders` chunks.
 *  2. The initial JS graph stays under INITIAL_JS_GZIP_BUDGET.
 *
 * Exits non-zero on failure so it can gate CI.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const INITIAL_JS_GZIP_BUDGET = 250 * 1024; // plan target: <250 KB gz

async function main() {
  const indexHtml = await fs.readFile(path.join(dist, "index.html"), "utf8");

  // Entry scripts + modulepreloads emitted into index.html
  const initial = new Set();
  for (const m of indexHtml.matchAll(/<script[^>]+src="\/(assets\/[^"]+\.js)"/g)) {
    initial.add(m[1]);
  }
  for (const m of indexHtml.matchAll(
    /<link[^>]+rel="modulepreload"[^>]+href="\/(assets\/[^"]+\.js)"/g,
  )) {
    initial.add(m[1]);
  }

  // Expand the static import closure of the initial chunks. Dynamic imports
  // (route-level lazy chunks) are excluded on purpose.
  const queue = [...initial];
  while (queue.length > 0) {
    const rel = queue.pop();
    const code = await fs.readFile(path.join(dist, rel), "utf8");
    for (const m of code.matchAll(/(?:^|[;,{}()\s])import[^"'`]*?["']\.\/([^"']+\.js)["']/g)) {
      const dep = `assets/${m[1]}`;
      if (!initial.has(dep)) {
        initial.add(dep);
        queue.push(dep);
      }
    }
    // `from"./chunk.js"` re-exports
    for (const m of code.matchAll(/from\s*["']\.\/([^"']+\.js)["']/g)) {
      const dep = `assets/${m[1]}`;
      if (!initial.has(dep)) {
        initial.add(dep);
        queue.push(dep);
      }
    }
  }

  let failed = false;
  let totalGzip = 0;
  const rows = [];
  for (const rel of [...initial].sort()) {
    const buf = await fs.readFile(path.join(dist, rel));
    const gz = zlib.gzipSync(buf, { level: 9 }).length;
    totalGzip += gz;
    rows.push({ rel, gz });
    if (/three-vendor|three-loaders|three-postfx/.test(rel)) {
      console.error(`FAIL: three chunk in initial graph: ${rel}`);
      failed = true;
    }
  }

  console.log("[check-bundle] initial JS graph (gzip):");
  for (const { rel, gz } of rows) {
    console.log(`  ${(gz / 1024).toFixed(1).padStart(7)} KB  ${rel}`);
  }
  console.log(`  ${"".padStart(7)}------`);
  console.log(`  ${(totalGzip / 1024).toFixed(1).padStart(7)} KB  TOTAL`);

  if (totalGzip > INITIAL_JS_GZIP_BUDGET) {
    console.error(
      `FAIL: initial JS ${(totalGzip / 1024).toFixed(1)} KB gz exceeds budget ${INITIAL_JS_GZIP_BUDGET / 1024} KB`,
    );
    failed = true;
  }

  if (failed) process.exit(1);
  console.log("[check-bundle] OK — no three in initial graph, budget met");
}

main().catch((err) => {
  console.error("[check-bundle] failed:", err);
  process.exit(1);
});
