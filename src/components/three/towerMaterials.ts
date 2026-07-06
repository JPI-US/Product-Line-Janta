import * as THREE from "three";

/** PV glass color shared by Designer and Utility tower renders */
export const TOWER_PANEL_COLOR = "#080808";

/** Match mesh / material names from both GLTF exports */
export function isPvPanelMesh(name: string): boolean {
  const n = name.toLowerCase();
  if (!n) return false;
  if (n.includes("470") || n.includes("panel")) return true;
  if (n.includes("af horz") || n.includes("af vert") || n.includes("af hyp")) {
    return true;
  }
  if (n.includes("tr81-lfm pv") || /\bpv\s*700/.test(n)) return true;
  if (n.includes("lfm solar") || n.includes("solar head")) return true;
  if (n === "black" || n.includes("blackcarpaint")) return true;
  if (/\bpv\b/.test(n) && !n.includes("jbox")) return true;
  return false;
}

/** Detect PV glass after gltf-transform (palette can strip names but keep dark base color) */
export function isPvPanelMaterial(mat: THREE.Material): boolean {
  if (isPvPanelMesh(mat.name || "")) return true;

  const standard = mat as THREE.MeshStandardMaterial;
  if (!("color" in standard) || !standard.color) return false;

  const { r, g, b } = standard.color;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  const metalness = standard.metalness ?? 0.5;
  const roughness = standard.roughness ?? 0.5;

  if (luminance < 0.14) return true;

  return luminance < 0.22 && metalness <= 0.35 && roughness >= 0.25;
}

export function meshUsesPvPanelMaterial(mesh: THREE.Mesh): boolean {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  return mats.some(
    (mat) => mat && (isPvPanelMesh(mesh.name || "") || isPvPanelMaterial(mat))
  );
}

export { optimizeTowerMeshes, syncSceneEnvironmentMaps } from "./towerMeshOptimizer";
