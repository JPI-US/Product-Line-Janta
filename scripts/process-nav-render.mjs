/**
 * Keys studio-grey backgrounds out of nav product renders → transparent PNG.
 * Usage: node scripts/process-nav-render.mjs <input> <output>
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage: node scripts/process-nav-render.mjs <input> <output>");
  process.exit(1);
}

function saturation(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function colorDist(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function sampleCorners(px, width, height, channels) {
  const pts = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
  ];
  const samples = pts.map(([x, y]) => {
    const i = (y * width + x) * channels;
    return [px[i], px[i + 1], px[i + 2]];
  });
  return samples
    .reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0])
    .map((v) => v / samples.length);
}

function isStudioGrey(r, g, b, bg) {
  const lum = (r + g + b) / 3;
  const sat = saturation(r, g, b);
  if (sat > 0.06) return false;
  if (lum < 78 || lum > 142) return false;
  return colorDist([r, g, b], bg) < 52;
}

async function processImage(src, dest) {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const px = new Uint8Array(data);
  const bg = sampleCorners(px, width, height, channels);

  const visited = new Uint8Array(width * height);
  const queue = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    const i = p * channels;
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    if (!isStudioGrey(r, g, b, bg)) return;
    visited[p] = 1;
    queue.push([x, y]);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (queue.length) {
    const [x, y] = queue.pop();
    const i = (y * width + x) * channels;
    px[i + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  // Defringe: soften leftover grey halos on transparent edges
  const alpha = new Uint8Array(width * height);
  for (let p = 0; p < width * height; p++) {
    alpha[p] = px[p * channels + 3];
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = y * width + x;
      if (alpha[p] === 0) continue;
      const i = p * channels;
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      if (!isStudioGrey(r, g, b, bg)) continue;

      let transparentNeighbors = 0;
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (alpha[ny * width + nx] === 0) transparentNeighbors++;
      }
      if (transparentNeighbors >= 2) {
        px[i + 3] = 0;
        alpha[p] = 0;
      }
    }
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(px, { raw: { width, height, channels } })
    .trim({ threshold: 8 })
    .png({ compressionLevel: 9 })
    .toFile(dest);

  const kb = Math.round(fs.statSync(dest).size / 1024);
  console.log(`  ✓ ${path.basename(dest)} (${kb} KB)`);
}

await processImage(input, output);
