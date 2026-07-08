/**
 * Compress every GLB under `public/models/` using:
 *   - error-bounded meshopt simplification, plus topology-ignoring "sloppy"
 *     simplification for dense CAD meshes (bolt/rail shells that strict
 *     simplify can't collapse)
 *   - Draco vs Meshopt geometry compression — whichever is smaller wins
 *   - WebP texture compression via sharp
 *   - dedup + weld + resample + prune to strip redundancy
 *   - unpartition — buffers are inlined so each .glb is a single file
 *     (no external .glb.bin sidecars; reported size = real download size)
 *
 * Also emits progressive LOD tiers for the production "-ready" models:
 *   `<name>-lod2.glb` — tiny proxy (loads first, swapped out when LOD0 lands)
 *   `<name>-lod1.glb` — mid tier for distance swaps
 *
 * Originals are backed up to `models-src/<same-path>/<name>.glb` (git-ignored)
 * the first time each model is seen, so re-running the script is idempotent
 * and you can always re-bake from the untouched source.
 *
 * NOTE: gltf-transform's `instance()` is intentionally NOT used — the runtime
 * tower optimizer (`towerMeshOptimizer.ts`) merges geometry by traversing
 * plain meshes and would silently drop EXT_mesh_gpu_instancing matrices.
 * Normals are recomputed at runtime after merge, which keeps the sloppy
 * simplification visually safe.
 *
 * Run: `npm run compress:models` (also runs automatically as `prebuild`).
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  draco,
  meshopt,
  prune,
  quantize,
  resample,
  simplify,
  textureCompress,
  unpartition,
  weld,
} from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import {
  MeshoptDecoder,
  MeshoptEncoder,
  MeshoptSimplifier,
} from "meshoptimizer";
import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modelsDir = path.join(root, "public", "models");
const backupDir = path.join(root, "models-src");

/**
 * Per-file tuning. `sloppyRatio`/`sloppyError` drive the topology-ignoring
 * pass (error relative to mesh extent); `ratio`/`error` the strict pass.
 * CAD exports carry absurd tessellation that never survives at product-page
 * scale — the sloppy pass reclaims it without visible silhouette change.
 */
const TUNING_OVERRIDES = {
  // Dense CAD structure (bolt shells, rails) — strict simplify plateaus at
  // ~1.8 MB, so use the topology-ignoring pass. Runtime recomputes normals.
  "TR-08-001-ready.glb": { sloppyRatio: 0.35, sloppyError: 0.01 },
  // Hero model — strict simplify only; sloppy destroys the perforated
  // honeycomb backing sheet that reads clearly at hero scale.
  "5.6k_10x4_panels-ready.glb": { ratio: 0.6, error: 0.005 },
};
const TUNING_DEFAULT = { ratio: 0.75, error: 0.001 };

/** Progressive LOD tiers baked for the production "-ready" models. */
const LOD_TIERS = [
  { suffix: "-lod1", sloppyRatio: 0.15, sloppyError: 0.05 },
  { suffix: "-lod2", sloppyRatio: 0.05, sloppyError: 0.15 },
];

/** Leave small parts alone — sloppy only pays off on dense meshes. */
const SLOPPY_MIN_TRIS = 500;

const isReadyModel = (file) => path.basename(file).includes("-ready");
const isLodOutput = (file) => /-lod\d\.glb$/i.test(file);

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.toLowerCase().endsWith(".glb")) out.push(full);
  }
  return out;
}

async function ensureBackup(file) {
  const rel = path.relative(modelsDir, file);
  const dest = path.join(backupDir, rel);
  try {
    await fs.access(dest);
    return dest;
  } catch {
    /* create it */
  }
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(file, dest);
  return dest;
}

/**
 * Topology-ignoring simplification via MeshoptSimplifier.simplifySloppy.
 * Rebuilds each dense primitive's index buffer against the existing vertex
 * streams; the follow-up strict simplify + prune compacts unused vertices.
 */
function sloppySimplify(targetRatio, targetError) {
  return (doc) => {
    for (const mesh of doc.getRoot().listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const posAttr = prim.getAttribute("POSITION");
        const idxAcc = prim.getIndices();
        if (!posAttr || !idxAcc) continue;
        const srcIndices = new Uint32Array(idxAcc.getArray());
        if (srcIndices.length / 3 < SLOPPY_MIN_TRIS) continue;

        // Dequantize positions (sources may store POSITION as i16_norm)
        const count = posAttr.getCount();
        const positions = new Float32Array(count * 3);
        const el = [0, 0, 0];
        for (let i = 0; i < count; i++) {
          posAttr.getElement(i, el);
          positions[i * 3] = el[0];
          positions[i * 3 + 1] = el[1];
          positions[i * 3 + 2] = el[2];
        }

        const targetCount = Math.min(
          Math.max(
            Math.floor((srcIndices.length * targetRatio) / 3) * 3,
            SLOPPY_MIN_TRIS * 3,
          ),
          srcIndices.length,
        );
        const [newIndices] = MeshoptSimplifier.simplifySloppy(
          srcIndices,
          positions,
          3,
          null,
          targetCount,
          targetError,
        );
        if (!newIndices || newIndices.length >= srcIndices.length) continue;
        idxAcc.setArray(
          count <= 65535 ? new Uint16Array(newIndices) : new Uint32Array(newIndices),
        );
      }
    }
  };
}

/** Shared cleanup + simplification, applied before compression. */
function baseTransforms(tuning) {
  const steps = [dedup(), weld({ tolerance: 0.0001 })];
  if (tuning.sloppyRatio != null) {
    steps.push(sloppySimplify(tuning.sloppyRatio, tuning.sloppyError ?? 0.01));
    // Strict pass at ratio 1.0 compacts vertex streams after index rewrite.
    // Normals are left as-is: sloppy keeps original vertices (positions and
    // normals unchanged), and the runtime merge recomputes them anyway.
    steps.push(
      simplify({ simplifier: MeshoptSimplifier, ratio: 1.0, error: 0.0001 }),
    );
  } else {
    steps.push(
      simplify({
        simplifier: MeshoptSimplifier,
        ratio: tuning.ratio ?? 0.75,
        error: tuning.error ?? 0.001,
      }),
    );
  }
  steps.push(
    resample(),
    prune({ keepAttributes: false, keepLeaves: false }),
    textureCompress({ encoder: sharp, targetFormat: "webp", quality: 82 }),
    unpartition(),
  );
  return steps;
}

/**
 * Compress one source document two ways (meshopt vs draco) and return the
 * smaller encoded GLB.
 */
async function encodeSmallest(io, source, tuning) {
  const meshoptDoc = await io.read(source);
  await meshoptDoc.transform(
    ...baseTransforms(tuning),
    quantize({ quantizePosition: 12, quantizeNormal: 8, quantizeTexcoord: 12 }),
    meshopt({ encoder: MeshoptEncoder, level: "high" }),
  );
  const meshoptBytes = await io.writeBinary(meshoptDoc);

  let dracoBytes = null;
  try {
    const dracoDoc = await io.read(source);
    await dracoDoc.transform(...baseTransforms(tuning), draco());
    dracoBytes = await io.writeBinary(dracoDoc);
  } catch (err) {
    console.warn(`[compress-models]   draco encode failed: ${err.message}`);
  }

  if (dracoBytes && dracoBytes.byteLength < meshoptBytes.byteLength) {
    return { bytes: dracoBytes, codec: "draco" };
  }
  return { bytes: meshoptBytes, codec: "meshopt" };
}

/** Remove stale external buffer sidecars left by the previous pipeline. */
async function removeStaleSidecars(file) {
  const dir = path.dirname(file);
  const base = path.basename(file, ".glb");
  for (const entry of await fs.readdir(dir)) {
    if (entry.startsWith(base) && entry.endsWith(".bin")) {
      await fs.rm(path.join(dir, entry));
      console.log(`[compress-models]   removed sidecar ${entry}`);
    }
  }
}

async function main() {
  await Promise.all([
    MeshoptDecoder.ready,
    MeshoptEncoder.ready,
    MeshoptSimplifier.ready,
  ]);

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(),
      "draco3d.encoder": await draco3d.createEncoderModule(),
      "meshopt.decoder": MeshoptDecoder,
      "meshopt.encoder": MeshoptEncoder,
    });

  const files = (await walk(modelsDir)).filter((f) => !isLodOutput(f));
  if (files.length === 0) {
    console.log("[compress-models] no GLBs under public/models/");
    return;
  }

  const report = [];
  for (const file of files) {
    const rel = path.relative(root, file);
    const source = await ensureBackup(file);
    const sourceBytes = (await fs.stat(source)).size;
    const name = path.basename(file);
    const tuning = TUNING_OVERRIDES[name] ?? TUNING_DEFAULT;

    console.log(`[compress-models] ${rel}`);

    let encoded;
    try {
      encoded = await encodeSmallest(io, source, tuning);
    } catch (err) {
      console.warn(`[compress-models] skip ${rel}: ${err.message}`);
      continue;
    }

    if (encoded.bytes.byteLength < sourceBytes) {
      await fs.writeFile(file, encoded.bytes);
    } else {
      await fs.copyFile(source, file);
      encoded.codec = "source-kept";
    }
    await removeStaleSidecars(file);

    const afterBytes = (await fs.stat(file)).size;
    report.push({
      file: rel,
      before: sourceBytes,
      after: afterBytes,
      codec: encoded.codec,
    });

    // Progressive LOD tiers only for the production "-ready" models
    if (isReadyModel(file)) {
      for (const tier of LOD_TIERS) {
        const lodPath = file.replace(/\.glb$/i, `${tier.suffix}.glb`);
        try {
          const lod = await encodeSmallest(io, source, tier);
          await fs.writeFile(lodPath, lod.bytes);
          report.push({
            file: path.relative(root, lodPath),
            before: sourceBytes,
            after: lod.bytes.byteLength,
            codec: `${lod.codec} ${tier.suffix}`,
          });
        } catch (err) {
          console.warn(
            `[compress-models]   ${tier.suffix} failed: ${err.message}`,
          );
        }
      }
    }
  }

  const fmt = (n) => `${(n / 1024).toFixed(0).padStart(6)} KB`;
  console.log("\n[compress-models] results:");
  let totalBefore = 0;
  let totalAfter = 0;
  for (const r of report) {
    totalBefore += r.before;
    totalAfter += r.after;
    const pct = ((1 - r.after / r.before) * 100).toFixed(1);
    console.log(
      `  ${fmt(r.before)} → ${fmt(r.after)}  (-${pct}%)  [${r.codec}]  ${r.file}`,
    );
  }
  const totalPct = ((1 - totalAfter / totalBefore) * 100).toFixed(1);
  console.log(
    `  ${"".padStart(6)}      TOTAL: ${fmt(totalBefore)} → ${fmt(totalAfter)}  (-${totalPct}%)`,
  );
}

main().catch((err) => {
  console.error("[compress-models] failed:", err);
  process.exit(1);
});
