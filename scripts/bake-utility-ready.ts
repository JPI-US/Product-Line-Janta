/**
 * Bakes utility mesh merge + top-panel simplify into TR-08-001-ready.glb.
 * Run via npm run optimize:models (after TR-08-001-web.glb exists).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { optimizeTowerMeshes } from "../src/components/three/towerMeshOptimizer.ts";
import { PRODUCT_TOWER_PREP } from "../src/components/three/productTowerPrep.ts";

/** GLTFExporter expects browser FileReader when embedding buffers */
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class {
    result: ArrayBuffer | null = null;
    onloadend: (() => void) | null = null;
    readAsArrayBuffer(blob: Blob) {
      void blob.arrayBuffer().then((buf) => {
        this.result = buf;
        this.onloadend?.();
      });
    }
  } as unknown as typeof FileReader;
}

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const input = path.join(projectRoot, "public/models/tr-08-001/TR-08-001-web.glb");
const output = path.join(
  projectRoot,
  "public/models/tr-08-001/TR-08-001-ready.glb"
);

function stripExportHelpers(rootObj: THREE.Object3D) {
  const toRemove: THREE.Object3D[] = [];
  rootObj.traverse((obj) => {
    if ((obj as THREE.Camera).isCamera || (obj as THREE.Light).isLight) {
      toRemove.push(obj);
    }
  });
  toRemove.forEach((obj) => obj.parent?.remove(obj));
}

function exportGlb(sceneRoot: THREE.Object3D, outPath: string): Promise<void> {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      sceneRoot,
      (result) => {
        if (!(result instanceof ArrayBuffer)) {
          reject(new Error("Expected binary GLB from GLTFExporter"));
          return;
        }
        fs.writeFileSync(outPath, Buffer.from(result));
        resolve();
      },
      (error) => reject(error),
      { binary: true }
    );
  });
}

async function main() {
  if (!fs.existsSync(input)) {
    console.error(`Missing ${input} — run gltf-transform step first.`);
    process.exit(1);
  }

  console.log("Baking utility ready GLB…");
  const loader = new GLTFLoader();
  const buffer = fs.readFileSync(input);
  const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
    loader.parse(
      buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      ),
      path.dirname(input) + path.sep,
      (parsed) => resolve(parsed),
      reject
    );
  });
  const sceneRoot = gltf.scene.clone(true);
  stripExportHelpers(sceneRoot);

  optimizeTowerMeshes(sceneRoot, PRODUCT_TOWER_PREP.meshOptimize);

  const rawOut = output.replace(/\.glb$/, ".raw.glb");
  await exportGlb(sceneRoot, rawOut);

  console.log("Compressing with meshopt…");
  execSync(
    `npx gltf-transform meshopt "${rawOut}" "${output}"`,
    { stdio: "inherit", cwd: projectRoot }
  );
  fs.unlinkSync(rawOut);

  const sizeMb = (fs.statSync(output).size / (1024 * 1024)).toFixed(2);
  console.log(`Wrote ${output} (${sizeMb} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
