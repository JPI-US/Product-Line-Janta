/**
 * Shared Three.js loaders — Draco + KTX2 + Meshopt, wired against the
 * three-stdlib addons that drei uses internally so there's no double instance.
 */
import {
  DRACOLoader,
  GLTFLoader,
  KTX2Loader,
  MeshoptDecoder,
} from "three-stdlib";
import type { WebGLRenderer } from "three";

const DRACO_CDN = "https://www.gstatic.com/draco/versioned/decoders/1.5.6/";
const BASIS_CDN = "https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/basis/";

let dracoSingleton: DRACOLoader | null = null;
let ktx2Singleton: KTX2Loader | null = null;
let meshoptSingleton: unknown = null;

/**
 * three-stdlib exports MeshoptDecoder as a factory; GLTFLoader needs the
 * instantiated decoder (with `.supported`), so build it once like drei does.
 * Lazy — a module-level call trips chunk-init ordering in the split build.
 */
function getMeshoptDecoder(): unknown {
  if (!meshoptSingleton) {
    meshoptSingleton =
      typeof MeshoptDecoder === "function"
        ? (MeshoptDecoder as unknown as () => unknown)()
        : MeshoptDecoder;
  }
  return meshoptSingleton;
}

export function getDracoLoader(): DRACOLoader {
  if (dracoSingleton) return dracoSingleton;
  dracoSingleton = new DRACOLoader();
  dracoSingleton.setDecoderPath(DRACO_CDN);
  dracoSingleton.setDecoderConfig({ type: "js" });
  return dracoSingleton;
}

export function getKtx2Loader(renderer?: WebGLRenderer): KTX2Loader {
  if (!ktx2Singleton) {
    ktx2Singleton = new KTX2Loader().setTranscoderPath(BASIS_CDN);
  }
  if (renderer) ktx2Singleton.detectSupport(renderer);
  return ktx2Singleton;
}

/**
 * Attach every runtime decoder to a GLTFLoader. Pass a WebGLRenderer to enable
 * KTX2 GPU-format detection; without one KTX2 falls back to CPU transcoding.
 */
export function configureGltfLoaders(
  loader: GLTFLoader,
  renderer?: WebGLRenderer,
): GLTFLoader {
  loader.setDRACOLoader(getDracoLoader());
  loader.setKTX2Loader(getKtx2Loader(renderer));
  loader.setMeshoptDecoder(getMeshoptDecoder() as never);
  return loader;
}

/** Fresh GLTFLoader with every decoder pre-attached. */
export function createGltfLoader(renderer?: WebGLRenderer): GLTFLoader {
  return configureGltfLoaders(new GLTFLoader(), renderer);
}

/** Dispose singletons — call from HMR cleanup only. */
export function disposeGltfLoaders(): void {
  dracoSingleton?.dispose();
  ktx2Singleton?.dispose();
  dracoSingleton = null;
  ktx2Singleton = null;
}
