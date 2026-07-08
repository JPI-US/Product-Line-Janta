/**
 * Drop-in wrapper around drei's `useGLTF` that ensures every model load goes
 * through the shared Draco + KTX2 + Meshopt loaders. Import from here instead
 * of `@react-three/drei` so future compression formats only need to be wired
 * once, in `./loaders.ts`.
 */
import { useGLTF as useGLTFDrei } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { ObjectMap } from "@react-three/fiber";
import type { GLTF, GLTFLoader } from "three-stdlib";
import { configureGltfLoaders } from "./loaders";

type UseGLTFReturn = GLTF & ObjectMap;

export function useGLTF(path: string): UseGLTFReturn {
  const gl = useThree((state) => state.gl);
  return useGLTFDrei(path, true, true, (loader) => {
    configureGltfLoaders(loader as unknown as GLTFLoader, gl);
  }) as UseGLTFReturn;
}

useGLTF.preload = (path: string) =>
  // r3f's useLoader.preload returns the in-flight promise — pass it through
  // so callers (useProgressiveModel) can await the full-res tier.
  useGLTFDrei.preload(path, true, true, (loader) => {
    configureGltfLoaders(loader as unknown as GLTFLoader);
  }) as unknown as Promise<unknown> | undefined;

useGLTF.clear = useGLTFDrei.clear;
