import * as THREE from "three";
import { SimplifyModifier } from "three/examples/jsm/modifiers/SimplifyModifier.js";
import { countGeometryTriangles } from "./towerGeometryStats";

const simplifyModifier = new SimplifyModifier();

const MIN_TRIS_TO_SIMPLIFY = 4_000;

/** Reduce triangle count on upward-facing PV glass only */
export function simplifyPanelGeometry(
  geometry: THREE.BufferGeometry,
  keepRatio: number,
  maxCollapseSteps = 12_000
): THREE.BufferGeometry {
  if (keepRatio >= 0.995) return geometry;

  const before = countGeometryTriangles(geometry);
  if (before < MIN_TRIS_TO_SIMPLIFY) return geometry;

  const targetTris = Math.max(400, Math.floor(before * keepRatio));
  let current = geometry;

  for (let pass = 0; pass < 4; pass++) {
    const tris = countGeometryTriangles(current);
    if (tris <= targetTris * 1.1) break;

    const position = current.getAttribute("position");
    if (!position || position.count < 24) break;

    const remaining = targetTris / Math.max(tris, 1);
    const collapseSteps = Math.min(
      Math.max(8, Math.floor(position.count * (1 - remaining))),
      maxCollapseSteps
    );

    try {
      const simplified = simplifyModifier.modify(current, collapseSteps);
      simplified.computeVertexNormals();
      if (simplified !== current) current.dispose();
      current = simplified;
    } catch {
      break;
    }
  }

  if (import.meta.env.DEV && current !== geometry) {
    const after = countGeometryTriangles(current);
    console.info(
      `[tower-prep] top panel surfaces ${before.toLocaleString()} → ${after.toLocaleString()} tris`
    );
  }

  return current;
}
