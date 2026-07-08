/**
 * Compress every raster image over ~100 KB under public/marketing/ and
 * public/towers/ into AVIF + WebP siblings, and generate an optimized JPG
 * fallback for every PNG (transparency preserved by the AVIF/WebP tracks,
 * so JPG can safely be flat).
 *
 * Also handles two special cases:
 *   - mohamed-og.png (>200 KB requirement for og:image): resized to
 *     1200×630 JPG at ≤200 KB, written next to the source.
 *   - .jpg sources: only AVIF + WebP siblings are generated; source is kept.
 *
 * Idempotent: siblings older than the source are regenerated, everything
 * else is skipped. Run: `bun run compress:images` (also `prebuild`).
 */
import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOTS = [
  path.join(root, "public", "marketing"),
  path.join(root, "public", "towers"),
  path.join(root, "public", "project-types"),
];
const MIN_BYTES = 100 * 1024;
const OG_PATH = path.join(root, "public", "marketing", "roots", "mohamed-og.png");
const OG_TARGET_BYTES = 200 * 1024;

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function needsRebuild(source, sibling) {
  try {
    const [s, o] = await Promise.all([fs.stat(source), fs.stat(sibling)]);
    return o.mtimeMs < s.mtimeMs;
  } catch {
    return true;
  }
}

async function makeSibling(source, ext, encoder) {
  const target = source.replace(/\.(png|jpe?g)$/i, `.${ext}`);
  if (target === source) return null;
  if (!(await needsRebuild(source, target))) return null;
  await encoder(source, target);
  const [srcSize, outSize] = await Promise.all([
    fs.stat(source).then((s) => s.size),
    fs.stat(target).then((s) => s.size),
  ]);
  return { target: path.relative(root, target), srcSize, outSize };
}

async function fixOgImage(report) {
  try {
    await fs.access(OG_PATH);
  } catch {
    return;
  }
  const before = (await fs.stat(OG_PATH)).size;
  if (before <= OG_TARGET_BYTES) return;
  const tmp = `${OG_PATH}.tmp.jpg`;
  const target = OG_PATH.replace(/\.png$/i, ".jpg");
  // Descend quality until under budget. og:image should always be JPG for
  // maximum crawler/social-preview compatibility.
  let quality = 85;
  let outSize = Infinity;
  while (quality >= 55) {
    await sharp(OG_PATH)
      .resize({ width: 1200, height: 630, fit: "cover", position: "attention" })
      .jpeg({ quality, mozjpeg: true, progressive: true, chromaSubsampling: "4:4:4" })
      .toFile(tmp);
    outSize = (await fs.stat(tmp)).size;
    if (outSize <= OG_TARGET_BYTES) break;
    quality -= 5;
  }
  await fs.rename(tmp, target);
  await fs.rm(OG_PATH); // remove the oversized PNG entirely
  report.push({
    target: path.relative(root, target),
    srcSize: before,
    outSize,
    note: `og:image resized 1200×630 @ q${quality}`,
  });
}

async function main() {
  const report = [];
  await fixOgImage(report);

  const allFiles = (await Promise.all(ROOTS.map(walk))).flat();
  const candidates = [];
  for (const file of allFiles) {
    if (!/\.(png|jpe?g)$/i.test(file)) continue;
    const { size } = await fs.stat(file);
    if (size < MIN_BYTES) continue;
    candidates.push(file);
  }

  for (const file of candidates) {
    const isPng = /\.png$/i.test(file);
    const results = await Promise.all([
      makeSibling(file, "avif", (src, dst) =>
        sharp(src).avif({ quality: 55, effort: 6 }).toFile(dst),
      ),
      makeSibling(file, "webp", (src, dst) =>
        sharp(src).webp({ quality: 82, effort: 5 }).toFile(dst),
      ),
      // Only add JPG fallback for PNG sources (JPGs are their own fallback).
      isPng
        ? makeSibling(file, "jpg", (src, dst) =>
            sharp(src)
              .flatten({ background: "#faf8f5" })
              .jpeg({ quality: 82, mozjpeg: true, progressive: true })
              .toFile(dst),
          )
        : Promise.resolve(null),
    ]);
    for (const r of results) if (r) report.push(r);
  }

  const fmt = (n) => `${(n / 1024).toFixed(0).padStart(6)} KB`;
  console.log("\n[compress-images] results:");
  let totalBefore = 0;
  let totalAfter = 0;
  for (const r of report) {
    totalBefore += r.srcSize;
    totalAfter += r.outSize;
    const pct = ((1 - r.outSize / r.srcSize) * 100).toFixed(1);
    const note = r.note ? `  [${r.note}]` : "";
    console.log(`  ${fmt(r.srcSize)} → ${fmt(r.outSize)}  (-${pct}%)  ${r.target}${note}`);
  }
  if (report.length === 0) {
    console.log("  (nothing to do — all siblings up to date)");
    return;
  }
  const totalPct = ((1 - totalAfter / totalBefore) * 100).toFixed(1);
  console.log(
    `  ${"".padStart(6)}      TOTAL: ${fmt(totalBefore)} → ${fmt(totalAfter)}  (-${totalPct}%)   over ${report.length} outputs`,
  );
}

main().catch((err) => {
  console.error("[compress-images] failed:", err);
  process.exit(1);
});
