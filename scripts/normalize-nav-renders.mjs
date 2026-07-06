import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT_W = 400;
const OUT_H = 500;
const PADDING = 28;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CURSOR_ASSETS = path.resolve(
  process.env.USERPROFILE ?? "",
  ".cursor/projects/c-Users-Seans-OneDrive-Documents-Janta-Product-Line/assets",
);

function resolveInput(fragments, fallback) {
  for (const fragment of fragments) {
    const local = path.resolve(ROOT, `public/marketing/nav-renders/source/${fragment}`);
    if (fs.existsSync(local)) return local;
    if (fs.existsSync(CURSOR_ASSETS)) {
      const name = fs.readdirSync(CURSOR_ASSETS).find((n) => n.includes(fragment));
      if (name) return path.join(CURSOR_ASSETS, name);
    }
  }
  return path.resolve(ROOT, fallback);
}

/** Key out light grey / off-white studio backgrounds from product screenshots. */
function keyOutStudioBackground(data, width, height) {
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  let br = 0;
  let bg = 0;
  let bb = 0;
  for (const [x, y] of corners) {
    const i = (y * width + x) * 4;
    br += data[i];
    bg += data[i + 1];
    bb += data[i + 2];
  }
  br /= corners.length;
  bg /= corners.length;
  bb /= corners.length;

  const hard = 22;
  const soft = 18;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const dr = r - br;
      const dg = g - bg;
      const db = b - bb;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      const lum = (r + g + b) / 3;
      const spread = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

      const isBg =
        dist < hard ||
        (lum > 228 && spread < 12 && dist < hard * 1.6) ||
        (lum > 240 && spread < 8);

      if (isBg) {
        data[i + 3] = 0;
      } else if (dist < hard + soft) {
        const t = (dist - hard) / soft;
        data[i + 3] = Math.round(Math.min(255, Math.max(0, t * 255)));
      } else {
        data[i + 3] = 255;
      }
    }
  }
}

async function removeBackground(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const keyed = Buffer.from(data);
  keyOutStudioBackground(keyed, info.width, info.height);

  return sharp(keyed, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function normalizeNavRender(input, output) {
  const keyed = await removeBackground(input);

  const trimmed = await sharp(keyed).trim({ threshold: 1 }).png().toBuffer();

  const meta = await sharp(trimmed).metadata();
  const srcW = meta.width ?? OUT_W;
  const srcH = meta.height ?? OUT_H;
  const innerW = OUT_W - PADDING * 2;
  const innerH = OUT_H - PADDING * 2;
  const scale = Math.min(innerW / srcW, innerH / srcH);
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);
  const left = Math.round((OUT_W - w) / 2);
  const top = Math.round((OUT_H - h) / 2 + 10);

  const resized = await sharp(trimmed).resize(w, h, { fit: "inside" }).png().toBuffer();
  const outPath = path.resolve(ROOT, output);

  await sharp({
    create: {
      width: OUT_W,
      height: OUT_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toFile(outPath);

  console.log(`Wrote ${outPath} from ${input}`);
}

const pairs = [
  {
    fragments: ["dsr-raw.png", "082401"],
    output: "public/marketing/nav-renders/dsr-tower.png",
    fallback: "public/marketing/nav-renders/source/dsr-raw.png",
  },
  {
    fragments: ["lfm-raw.png", "082418"],
    output: "public/marketing/nav-renders/lfm-tower.png",
    fallback: "public/marketing/nav-renders/source/lfm-raw.png",
  },
];

for (const { fragments, output, fallback } of pairs) {
  const input = resolveInput(fragments, fallback);
  await normalizeNavRender(input, output);
}
