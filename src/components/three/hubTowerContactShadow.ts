import * as THREE from "three";

let cachedTexture: THREE.CanvasTexture | null = null;

/** Soft oval contact shadow — feathered radial falloff like product renders */
export function getHubTowerContactShadowTexture(): THREE.CanvasTexture {
  if (cachedTexture) return cachedTexture;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("contact shadow canvas unavailable");

  const cx = size * 0.5;
  const cy = size * 0.52;
  const radius = size * 0.48;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, "rgba(28, 34, 44, 0.62)");
  gradient.addColorStop(0.28, "rgba(28, 34, 44, 0.28)");
  gradient.addColorStop(0.52, "rgba(28, 34, 44, 0.1)");
  gradient.addColorStop(0.78, "rgba(28, 34, 44, 0.03)");
  gradient.addColorStop(1, "rgba(28, 34, 44, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  cachedTexture = new THREE.CanvasTexture(canvas);
  cachedTexture.colorSpace = THREE.SRGBColorSpace;
  cachedTexture.needsUpdate = true;
  return cachedTexture;
}

export type HubTowerContactShadowFootprint = {
  width: number;
  depth: number;
};

export function measureHubTowerContactShadowFootprint(
  object: THREE.Object3D
): HubTowerContactShadowFootprint {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  return {
    width: Math.max(2.6, size.x * 1.22),
    depth: Math.max(2.1, size.z * 1.28),
  };
}
