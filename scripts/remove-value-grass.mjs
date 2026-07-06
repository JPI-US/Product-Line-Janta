import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = path.join(root, "public/marketing/value-aerial-solar.png");
const output = path.join(root, "public/marketing/value-aerial-panels.png");

function rgbToHsv(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return [h, s, v];
}

function keepPixel(r, g, b) {
  const [h, s, v] = rgbToHsv(r, g, b);

  if (v < 0.26) return true;
  if (v > 0.82 && s < 0.25) return true;
  if (h >= 165 && h <= 255 && s > 0.1 && v < 0.72) return true;
  if (h >= 45 && h <= 155 && s > 0.1 && v > 0.16) return false;
  if (g > r + 10 && g > b + 6 && v > 0.2) return false;
  return v < 0.4;
}

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  data[i + 3] = keepPixel(r, g, b) ? 255 : 0;
}

await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(`Wrote ${output} (${info.width}x${info.height})`);
