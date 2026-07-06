import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { meshUsesPvPanelMaterial, TOWER_PANEL_COLOR } from "./towerMaterials";
import { simplifyPanelGeometry } from "./towerPanelSimplify";

export type MeshOptimizeOptions = {
  structureCastShadow?: boolean;
  /**
   * Simplify only upward-facing PV glass (keeps panel edge/side geometry intact).
   * Typical values: utility 0.42–0.5, designer 0.55–0.65
   */
  topSurfaceSimplifyKeepRatio?: number;
  topSurfaceNormalMinY?: number;
  topSurfaceSimplifyMaxSteps?: number;
};

/** World-space +Y threshold after bake — faces pointing up = glass tops */
const DEFAULT_TOP_NORMAL_MIN_Y = 0.52;

const PANEL_METALNESS = 0.06;
const PANEL_ROUGHNESS = 0.38;
const PANEL_ENV_INTENSITY = 0.62;
const PANEL_CLEARCOAT = 0.1;
const PANEL_CLEARCOAT_ROUGHNESS = 0.22;

let sharedPanelMaterial: THREE.MeshPhysicalMaterial | null = null;
const structureMaterialCache = new Map<string, THREE.MeshStandardMaterial>();

function isBrightStructure(label: string): boolean {
  const n = label.toLowerCase();
  return (
    n.includes("stainless") ||
    n.includes("aluminum") ||
    n.includes("polished") ||
    n.includes("steel")
  );
}

function applyStructureMaterial(m: THREE.MeshStandardMaterial, label: string) {
  const bright = isBrightStructure(label);
  m.metalness = Math.min(m.metalness ?? 0.4, bright ? 0.62 : 0.75);
  m.roughness = Math.max(m.roughness ?? 0.45, bright ? 0.44 : 0.38);
  m.envMapIntensity = bright ? 1.02 : 0.88;

  if ("clearcoat" in m) {
    const physical = m as THREE.MeshPhysicalMaterial;
    physical.clearcoat = 0;
    physical.clearcoatRoughness = 0;
  }
}

function structureBucketKey(
  source: THREE.MeshStandardMaterial,
  label: string
): string {
  const bright = isBrightStructure(label) ? "1" : "0";
  const mapId = source.map?.uuid ?? "none";
  const color = source.color.getHexString();
  const name = source.name || "";
  return `${bright}|${mapId}|${color}|${name}`;
}

export function getSharedPanelMaterial(): THREE.MeshPhysicalMaterial {
  if (!sharedPanelMaterial) {
    sharedPanelMaterial = new THREE.MeshPhysicalMaterial({
      color: TOWER_PANEL_COLOR,
      metalness: PANEL_METALNESS,
      roughness: PANEL_ROUGHNESS,
      clearcoat: PANEL_CLEARCOAT,
      clearcoatRoughness: PANEL_CLEARCOAT_ROUGHNESS,
    });
    sharedPanelMaterial.envMapIntensity = PANEL_ENV_INTENSITY;
  }
  return sharedPanelMaterial;
}

function getCachedStructureMaterial(
  source: THREE.MeshStandardMaterial,
  label: string
): THREE.MeshStandardMaterial {
  const key = structureBucketKey(source, label);
  const cached = structureMaterialCache.get(key);
  if (cached) return cached;

  const m = source.clone();
  applyStructureMaterial(m, label);
  m.needsUpdate = true;
  structureMaterialCache.set(key, m);
  return m;
}

type MeshBucket = {
  geos: THREE.BufferGeometry[];
  material: THREE.MeshStandardMaterial;
  label: string;
};

const rootInverse = new THREE.Matrix4();
const localMatrix = new THREE.Matrix4();

const normalScratch = new THREE.Vector3();

function averageNormalY(geometry: THREE.BufferGeometry): number {
  if (!geometry.getAttribute("normal")) {
    geometry.computeVertexNormals();
  }
  const normals = geometry.getAttribute("normal");
  if (!normals) return 0;

  let sumY = 0;
  for (let i = 0; i < normals.count; i++) {
    normalScratch.fromBufferAttribute(normals, i);
    sumY += normalScratch.y;
  }
  return sumY / normals.count;
}

function collectMeshGeometry(
  mesh: THREE.Mesh,
  geos: THREE.BufferGeometry[],
  inverseRoot: THREE.Matrix4
) {
  mesh.updateWorldMatrix(true, false);
  localMatrix.copy(mesh.matrixWorld).premultiply(inverseRoot);
  const geo = mesh.geometry.clone();
  geo.applyMatrix4(localMatrix);
  geos.push(geo);
}

function collectPanelGeometry(
  mesh: THREE.Mesh,
  topGeos: THREE.BufferGeometry[],
  sideGeos: THREE.BufferGeometry[],
  inverseRoot: THREE.Matrix4,
  topNormalMinY: number
) {
  mesh.updateWorldMatrix(true, false);
  localMatrix.copy(mesh.matrixWorld).premultiply(inverseRoot);
  const geo = mesh.geometry.clone();
  geo.applyMatrix4(localMatrix);

  if (averageNormalY(geo) >= topNormalMinY) {
    topGeos.push(geo);
  } else {
    sideGeos.push(geo);
  }
}

/**
 * Collapse meshes into a few merged draw calls + shared materials.
 * Triangle reduction is done offline via npm run optimize:models (GLB assets).
 */
export function optimizeTowerMeshes(
  root: THREE.Object3D,
  options: MeshOptimizeOptions = {}
) {
  const structureCastShadow = options.structureCastShadow ?? true;
  const topSimplifyKeep = options.topSurfaceSimplifyKeepRatio;
  const topNormalMinY =
    options.topSurfaceNormalMinY ?? DEFAULT_TOP_NORMAL_MIN_Y;
  const topMaxSteps = options.topSurfaceSimplifyMaxSteps ?? 12_000;

  root.updateMatrixWorld(true);
  rootInverse.copy(root.matrixWorld).invert();

  const panelTopGeometries: THREE.BufferGeometry[] = [];
  const panelSideGeometries: THREE.BufferGeometry[] = [];
  const panelMeshes: THREE.Mesh[] = [];
  const structureBuckets = new Map<string, MeshBucket>();
  const structureMeshes: THREE.Mesh[] = [];

  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const meshName = mesh.name || "";
    const sourceMats = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    const label = `${meshName} ${sourceMats[0]?.name || ""}`;
    const isPanel = meshUsesPvPanelMaterial(mesh);

    if (isPanel) {
      collectPanelGeometry(
        mesh,
        panelTopGeometries,
        panelSideGeometries,
        rootInverse,
        topNormalMinY
      );
      panelMeshes.push(mesh);
      return;
    }

    const mat = sourceMats[0];
    if (!mat || !("metalness" in mat)) return;

    const stdMat = mat as THREE.MeshStandardMaterial;
    const key = structureBucketKey(stdMat, label);
    let bucket = structureBuckets.get(key);
    if (!bucket) {
      bucket = {
        geos: [],
        material: getCachedStructureMaterial(stdMat, label),
        label,
      };
      structureBuckets.set(key, bucket);
    }
    collectMeshGeometry(mesh, bucket.geos, rootInverse);
    structureMeshes.push(mesh);
  });

  const mergedGroup = new THREE.Group();
  mergedGroup.name = "tower-merged";

  let panelsMerged = false;
  const panelParts: THREE.BufferGeometry[] = [];

  if (panelTopGeometries.length > 0) {
    let topMerged = mergeGeometries(panelTopGeometries, false);
    panelTopGeometries.forEach((g) => g.dispose());
    if (topMerged) {
      if (topSimplifyKeep !== undefined && topSimplifyKeep < 0.995) {
        topMerged = simplifyPanelGeometry(
          topMerged,
          topSimplifyKeep,
          topMaxSteps
        );
      }
      panelParts.push(topMerged);
    }
  }

  if (panelSideGeometries.length > 0) {
    const sideMerged = mergeGeometries(panelSideGeometries, false);
    panelSideGeometries.forEach((g) => g.dispose());
    if (sideMerged) panelParts.push(sideMerged);
  }

  if (panelParts.length > 0) {
    const merged =
      panelParts.length === 1
        ? panelParts[0]
        : mergeGeometries(panelParts, false);
    if (merged) {
      if (panelParts.length > 1) {
        panelParts.forEach((g) => g.dispose());
      }
      merged.computeVertexNormals();
      const panelMesh = new THREE.Mesh(merged, getSharedPanelMaterial());
      panelMesh.name = "tower-panels-merged";
      panelMesh.castShadow = false;
      panelMesh.receiveShadow = false;
      panelMesh.frustumCulled = true;
      mergedGroup.add(panelMesh);
      panelsMerged = true;
    }
  }

  structureBuckets.forEach((bucket, key) => {
    if (bucket.geos.length === 0) return;
    const merged = mergeGeometries(bucket.geos, false);
    bucket.geos.forEach((g) => g.dispose());
    if (!merged) return;

    merged.computeVertexNormals();
    const structureMesh = new THREE.Mesh(merged, bucket.material);
    structureMesh.name = `tower-structure-${key}`;
    structureMesh.castShadow = structureCastShadow;
    structureMesh.receiveShadow = false;
    structureMesh.frustumCulled = true;
    mergedGroup.add(structureMesh);
  });

  if (mergedGroup.children.length > 0) {
    if (panelsMerged) {
      panelMeshes.forEach((mesh) => mesh.parent?.remove(mesh));
    } else {
      applyPanelMaterialsInPlace(root);
    }
    structureMeshes.forEach((mesh) => mesh.parent?.remove(mesh));
    root.add(mergedGroup);
    mergedGroup.matrixAutoUpdate = false;
  } else if (panelMeshes.length > 0) {
    applyPanelMaterialsInPlace(root);
  }
}

/** When merge misses panels, at least apply shared PV material in place */
export function applyDesignerTowerMaterials(root: THREE.Object3D) {
  applyPanelMaterialsInPlace(root);
}

function applyPanelMaterialsInPlace(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    if (!meshUsesPvPanelMaterial(mesh)) return;
    mesh.material = getSharedPanelMaterial();
    mesh.castShadow = false;
    mesh.receiveShadow = false;
  });
}

export function syncSceneEnvironmentMaps(env: THREE.Texture) {
  const materials: THREE.MeshStandardMaterial[] = [];
  if (sharedPanelMaterial) materials.push(sharedPanelMaterial);
  structureMaterialCache.forEach((mat) => materials.push(mat));

  materials.forEach((mat) => {
    if (mat.envMap !== env) {
      mat.envMap = env;
      mat.needsUpdate = true;
    }
  });
}
