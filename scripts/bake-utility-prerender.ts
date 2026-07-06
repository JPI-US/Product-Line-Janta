/**
 * Renders utility tower rotation frames for the prerender viewport.
 * Requires: npm install (gl + sharp are devDependencies)
 *
 * Usage: npm run bake:utility-prerender
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import createGL from "gl";
import sharp from "sharp";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { getSplitViewCamera, PAGE_BG, SCENE } from "../src/components/three/sceneConfig.ts";
import {
  applySplitViewYawOffset,
  getSplitViewBaseYaw,
  getSunPosition,
  getTowerLightTarget,
  SUN_TRACK_BLEND_END,
} from "../src/components/three/sceneScroll.ts";
import { prepareTowerSceneFromGltf } from "../src/components/three/towerScenePrep.ts";
import { TOWER_YAW_HALF_RANGE } from "../src/components/three/towerSharedRotation.ts";
import { UTILITY_PRERENDER } from "../src/components/three/utilityPrerenderConfig.ts";
import { UTILITY_SCENE } from "../src/components/three/utilitySceneConfig.ts";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const MODEL_CANDIDATES = [
  path.join(projectRoot, "public/models/tr-08-001/TR-08-001-ready.glb"),
  path.join(projectRoot, "public/models/tr-08-001/TR-08-001-web.glb"),
  path.join(projectRoot, "public/models/tr-08-001/TR-08-001.gltf"),
];

const outDir = path.join(
  projectRoot,
  "public/towers/utility-prerender"
);

const { frameCount, width, height } = UTILITY_PRERENDER;

function resolveModelPath(): string {
  for (const candidate of MODEL_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    "No utility model found. Run npm run optimize:models or keep TR-08-001.gltf in public/models."
  );
}

function patchWebGL1Context(context: WebGLRenderingContext) {
  const gl = context as WebGLRenderingContext & Record<string, unknown>;
  const noop = () => undefined;
  for (const key of [
    "texImage3D",
    "texSubImage3D",
    "copyTexSubImage3D",
    "compressedTexImage3D",
    "compressedTexSubImage3D",
    "framebufferTextureLayer",
  ]) {
    if (typeof gl[key] !== "function") {
      gl[key] = noop;
    }
  }
}

function simplifyMaterials(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const sources = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    mesh.material = sources.map((source) => {
      const m = source as THREE.MeshStandardMaterial;
      return new THREE.MeshLambertMaterial({
        color: m.color?.clone() ?? new THREE.Color(0x888888),
        map: m.map ?? null,
      });
    });
  });
}

function createHeadlessRenderer(w: number, h: number) {
  const context = createGL(w, h, {
    preserveDrawingBuffer: true,
    antialias: true,
  });
  patchWebGL1Context(context);
  const canvas = {
    width: w,
    height: h,
    style: {},
    clientWidth: w,
    clientHeight: h,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    getContext: () => context,
  } as unknown as HTMLCanvasElement;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: context as unknown as WebGLRenderingContext,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  Object.defineProperty(renderer.capabilities, "isWebGL2", {
    get: () => false,
    configurable: true,
  });
  return renderer;
}

function addUtilityLights(
  holder: THREE.Group,
  towerX: number,
  panelYaw: number
) {
  const profile = SCENE.lighting.utility;
  const focus = getTowerLightTarget(towerX, SCENE.lookAtEnd.y);
  const sunPos = getSunPosition(
    SUN_TRACK_BLEND_END,
    towerX,
    undefined,
    panelYaw
  );

  holder.add(
    new THREE.AmbientLight(SCENE.sun.ambient, profile.ambientIntensity)
  );
  holder.add(
    new THREE.HemisphereLight(
      profile.hemisphereSky,
      profile.hemisphereGround,
      profile.hemisphereIntensity
    )
  );

  const key = new THREE.DirectionalLight(SCENE.sun.color, profile.keyIntensity);
  key.position.copy(sunPos);
  key.target.position.copy(focus);
  holder.add(key);
  holder.add(key.target);
}

async function loadUtilityScene(modelPath: string) {
  const loader = new GLTFLoader();
  if (modelPath.endsWith(".glb")) {
    loader.setMeshoptDecoder(MeshoptDecoder);
  }

  const buffer = fs.readFileSync(modelPath);
  const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
    loader.parse(
      buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      ),
      path.dirname(modelPath) + path.sep,
      (parsed) => resolve(parsed),
      reject
    );
  });

  const prepared = prepareTowerSceneFromGltf(gltf.scene, "utility-prerender-bake", {
    scale: UTILITY_SCENE.tower.scale,
    baseClearance: UTILITY_SCENE.tower.baseClearance,
    skipMeshOptimize: modelPath.includes("-ready"),
    meshOptimize: UTILITY_SCENE.prep.meshOptimize,
  });

  return prepared;
}

async function main() {
  if (typeof globalThis.window === "undefined") {
    (globalThis as typeof globalThis & { window: Window }).window = {
      cancelAnimationFrame: () => undefined,
      requestAnimationFrame: (cb: FrameRequestCallback) =>
        setTimeout(() => cb(performance.now()), 0) as unknown as number,
    } as Window;
  }

  const modelPath = resolveModelPath();
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Model: ${path.relative(projectRoot, modelPath)}`);
  console.log(`Output: ${path.relative(projectRoot, outDir)}`);
  console.log(`Frames: ${frameCount} @ ${width}x${height}`);

  const renderer = createHeadlessRenderer(width, height);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PAGE_BG);

  const { offsetX, offsetY, yawOffset } = UTILITY_SCENE.tower;
  const { root: towerRoot, baseLift } = await loadUtilityScene(modelPath);
  simplifyMaterials(towerRoot);
  towerRoot.position.set(offsetX, baseLift + offsetY, 0);
  scene.add(towerRoot);
  const lightsHolder = new THREE.Group();
  scene.add(lightsHolder);

  const splitBaseYaw = getSplitViewBaseYaw(
    SUN_TRACK_BLEND_END,
    offsetX,
    yawOffset
  );

  const { position, lookAt: lookAtArr, fov } = getSplitViewCamera(offsetX);
  const camera = new THREE.PerspectiveCamera(
    fov,
    width / height,
    0.1,
    200
  );
  camera.position.set(...position);
  const lookAt = new THREE.Vector3(...lookAtArr);
  camera.lookAt(lookAt);

  for (let i = 0; i < frameCount; i++) {
    const t = frameCount <= 1 ? 0 : i / (frameCount - 1);
    const yawOffsetFrame = THREE.MathUtils.lerp(
      -TOWER_YAW_HALF_RANGE,
      TOWER_YAW_HALF_RANGE,
      t
    );

    towerRoot.rotation.y = applySplitViewYawOffset(
      splitBaseYaw,
      yawOffsetFrame,
      TOWER_YAW_HALF_RANGE
    );
    towerRoot.updateMatrixWorld(true);

    lightsHolder.clear();
    addUtilityLights(lightsHolder, offsetX, 0);

    renderer.render(scene, camera);

    const gl = renderer.getContext();
    const fb = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    if (fb) gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    let nonZero = 0;
    for (let p = 0; p < pixels.length; p += 4) {
      if (pixels[p + 3] > 0) nonZero++;
    }
    if (i === 0 && nonZero < 100) {
      console.warn(
        "[bake] Frame 0 looks empty — headless GL may not support this GPU path."
      );
    }

    const flipped = Buffer.alloc(width * height * 4);
    const row = width * 4;
    for (let y = 0; y < height; y++) {
      const srcRow = (height - 1 - y) * row;
      flipped.set(pixels.subarray(srcRow, srcRow + row), y * row);
    }

    const name = `frame-${String(i).padStart(3, "0")}.webp`;
    await sharp(flipped, { raw: { width, height, channels: 4 } })
      .webp({ quality: 86 })
      .toFile(path.join(outDir, name));

    if (i % 8 === 0 || i === frameCount - 1) {
      console.log(`  ${i + 1}/${frameCount}`);
    }
  }

  const manifest = {
    frameCount,
    width,
    height,
    format: "webp",
    pattern: "frame-{index}.webp",
    basePath: UTILITY_PRERENDER.basePath,
  };
  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  try {
    renderer.dispose();
  } catch {
    /* headless: dispose may reference missing window */
  }

  console.log("\nDone. Hard-refresh /3d to use prerender frames.");
  try {
    execSync(`git status --short "${path.relative(projectRoot, outDir)}"`, {
      cwd: projectRoot,
      stdio: "inherit",
    });
  } catch {
    /* git optional */
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
