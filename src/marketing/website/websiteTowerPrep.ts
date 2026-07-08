import * as THREE from "three";
import { meshUsesPvPanelMaterial } from "../../components/three/towerMaterials";
import type { TowerPrepConfig } from "../../components/three/towerScenePrep";
import { WEBSITE_SCENE } from "./websiteSceneConfig";

export const WEBSITE_TOWER_PREP_KEY = "website-designer-v9";

let panelMaterial: THREE.MeshStandardMaterial | null = null;
let silhouetteMaterial: THREE.MeshStandardMaterial | null = null;

const boundsScratch = new THREE.Box3();
const centerScratch = new THREE.Vector3();
const sizeScratch = new THREE.Vector3();
const towerSizeScratch = new THREE.Vector3();

export function getWebsiteTowerPrepConfig(): TowerPrepConfig {
  return {
    scale: WEBSITE_SCENE.tower.scale,
    baseClearance: WEBSITE_SCENE.tower.baseClearance,
    skipMeshOptimize: true,
  };
}

/** Dark PV glass grid — front faces only so the rear reads as a clean mass */
function createWebsitePanelCellTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0b1e34";
  ctx.fillRect(0, 0, size, size);

  const fineCells = 24;
  const fineStep = size / fineCells;
  ctx.strokeStyle = "#173552";
  ctx.lineWidth = 1;
  for (let i = 0; i <= fineCells; i++) {
    const p = Math.round(i * fineStep) + 0.5;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  const majorCells = 4;
  const majorStep = size / majorCells;
  ctx.strokeStyle = "#406892";
  ctx.lineWidth = 2;
  for (let i = 0; i <= majorCells; i++) {
    const p = Math.round(i * majorStep) + 1;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3.5, 3.5);
  tex.anisotropy = 2;
  tex.needsUpdate = true;
  return tex;
}

function ensureWebsiteMaterials() {
  if (panelMaterial && silhouetteMaterial) return;

  const panelMap =
    typeof document !== "undefined" ? createWebsitePanelCellTexture() : null;

  panelMaterial = new THREE.MeshStandardMaterial({
    color: "#0f2d4c",
    map: panelMap,
    metalness: 0.08,
    roughness: 0.62,
    envMapIntensity: 0.28,
    side: THREE.FrontSide,
  });

  /** Pole / stand / back — flat matte mass, no readable detail */
  silhouetteMaterial = new THREE.MeshStandardMaterial({
    color: "#0a0e14",
    metalness: 0,
    roughness: 1,
    envMapIntensity: 0,
    side: THREE.DoubleSide,
  });
}

function isWebsiteHeroPanel(mesh: THREE.Mesh, towerBounds: THREE.Box3): boolean {
  if (!meshUsesPvPanelMaterial(mesh)) return false;

  boundsScratch.setFromObject(mesh);
  boundsScratch.getCenter(centerScratch);
  boundsScratch.getSize(sizeScratch);

  towerBounds.getSize(towerSizeScratch);
  const relY = (centerScratch.y - towerBounds.min.y) / Math.max(towerSizeScratch.y, 0.001);

  // Hardware / junction at the base — collapse into silhouette
  if (relY < 0.14 && sizeScratch.y < towerSizeScratch.y * 0.22) {
    return false;
  }

  return true;
}

export function getWebsiteHeroTowerMaterials(): {
  panel: THREE.MeshStandardMaterial;
  silhouette: THREE.MeshStandardMaterial;
} {
  ensureWebsiteMaterials();
  return {
    panel: panelMaterial!,
    silhouette: silhouetteMaterial!,
  };
}

export function applyWebsiteMarketingMaterials(root: THREE.Object3D) {
  ensureWebsiteMaterials();
  if (!panelMaterial || !silhouetteMaterial) return;

  boundsScratch.setFromObject(root);
  const towerBounds = boundsScratch.clone();

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.material = isWebsiteHeroPanel(mesh, towerBounds)
      ? panelMaterial!
      : silhouetteMaterial!;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
}

export function finalizeWebsiteTowerScene(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = true;

    if (mesh.geometry && !mesh.geometry.boundingSphere) {
      mesh.geometry.computeBoundingSphere();
    }
  });

  applyWebsiteMarketingMaterials(root);
}
