import * as THREE from "three";

/**
 * Procedural monocrystalline PV textures — diamond-cell albedo plus a
 * grid-line normal map, baked once to canvas (no CAD source needed). Applied
 * to the merged panel material with planar UVs generated in
 * `towerMeshOptimizer.applyPanelPlanarUvs`.
 */

const TEX_SIZE = 1024;
/** Cells across one texture tile */
const CELLS = 8;
/** Busbar count per cell (thin conductor lines) */
const BUSBARS = 3;

let albedoSingleton: THREE.CanvasTexture | null = null;
let normalSingleton: THREE.CanvasTexture | null = null;

function makeCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext("2d")!;
  return [canvas, ctx];
}

/** Monocrystalline cell field: near-black cells, clipped corners, busbars. */
export function getPanelAlbedoTexture(): THREE.CanvasTexture {
  if (albedoSingleton) return albedoSingleton;
  const [canvas, ctx] = makeCanvas();
  const cell = TEX_SIZE / CELLS;
  const gap = Math.max(3, cell * 0.02);
  const corner = cell * 0.12;

  // Backing sheet behind the cell gaps
  ctx.fillStyle = "#141821";
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  for (let cy = 0; cy < CELLS; cy++) {
    for (let cx = 0; cx < CELLS; cx++) {
      const x = cx * cell + gap / 2;
      const y = cy * cell + gap / 2;
      const w = cell - gap;
      const h = cell - gap;

      // Slight per-cell tonal variation keeps the array from looking synthetic
      const v = 8 + Math.floor(Math.random() * 7);
      ctx.fillStyle = `rgb(${v}, ${v + 4}, ${v + 12})`;

      // Octagon — monocrystalline clipped corners
      ctx.beginPath();
      ctx.moveTo(x + corner, y);
      ctx.lineTo(x + w - corner, y);
      ctx.lineTo(x + w, y + corner);
      ctx.lineTo(x + w, y + h - corner);
      ctx.lineTo(x + w - corner, y + h);
      ctx.lineTo(x + corner, y + h);
      ctx.lineTo(x, y + h - corner);
      ctx.lineTo(x, y + corner);
      ctx.closePath();
      ctx.fill();

      // Faint diagonal sheen per cell
      const sheen = ctx.createLinearGradient(x, y, x + w, y + h);
      sheen.addColorStop(0, "rgba(90, 130, 190, 0.10)");
      sheen.addColorStop(0.5, "rgba(90, 130, 190, 0.02)");
      sheen.addColorStop(1, "rgba(30, 50, 80, 0.06)");
      ctx.fillStyle = sheen;
      ctx.fill();

      // Busbars
      ctx.strokeStyle = "rgba(196, 204, 216, 0.5)";
      ctx.lineWidth = Math.max(1, cell * 0.006);
      for (let b = 1; b <= BUSBARS; b++) {
        const bx = x + (w * b) / (BUSBARS + 1);
        ctx.beginPath();
        ctx.moveTo(bx, y);
        ctx.lineTo(bx, y + h);
        ctx.stroke();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16; // three clamps to the renderer max
  albedoSingleton = tex;
  return tex;
}

/**
 * Normal map with grooves along the cell grid — built from a heightmap and a
 * Sobel pass so the seams catch light like real module framing.
 */
export function getPanelNormalTexture(): THREE.CanvasTexture {
  if (normalSingleton) return normalSingleton;
  const [, hctx] = makeCanvas();
  const cell = TEX_SIZE / CELLS;
  const gap = Math.max(3, cell * 0.02);

  // Heightmap: white = raised glass, dark = grid groove
  hctx.fillStyle = "#ffffff";
  hctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  hctx.strokeStyle = "#404040";
  hctx.lineWidth = gap;
  for (let i = 0; i <= CELLS; i++) {
    const p = i * cell;
    hctx.beginPath();
    hctx.moveTo(p, 0);
    hctx.lineTo(p, TEX_SIZE);
    hctx.stroke();
    hctx.beginPath();
    hctx.moveTo(0, p);
    hctx.lineTo(TEX_SIZE, p);
    hctx.stroke();
  }

  const height = hctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
  const [normalCanvas, nctx] = makeCanvas();
  const normal = nctx.createImageData(TEX_SIZE, TEX_SIZE);
  const strength = 1.6;
  const at = (x: number, y: number) => {
    const xi = (x + TEX_SIZE) % TEX_SIZE;
    const yi = (y + TEX_SIZE) % TEX_SIZE;
    return height.data[(yi * TEX_SIZE + xi) * 4] / 255;
  };
  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      const dx =
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1)) -
        (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
      const dy =
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1)) -
        (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
      const nx = -dx * strength;
      const ny = -dy * strength;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * TEX_SIZE + x) * 4;
      normal.data[i] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      normal.data[i + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      normal.data[i + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      normal.data[i + 3] = 255;
    }
  }
  nctx.putImageData(normal, 0, 0);

  const tex = new THREE.CanvasTexture(normalCanvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 16;
  normalSingleton = tex;
  return tex;
}
