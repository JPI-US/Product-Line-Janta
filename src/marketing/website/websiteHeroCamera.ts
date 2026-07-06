import * as THREE from "three";
import type { HubTowerLayout } from "../../components/three/hubTowerConfig";

const pivotScratch = new THREE.Vector3();
const camRelScratch = new THREE.Vector3();
const lookRelScratch = new THREE.Vector3();
const lookTargetScratch = new THREE.Vector3();
const upScratch = new THREE.Vector3(0, 1, 0);
const axisScratch = new THREE.Vector3();

/**
 * Tilt the camera upward only — rotates camera + look-at together around the
 * tower so the tower stays fixed on screen (no lateral drift).
 */
export function applyWebsiteHeroCameraPitch(
  camera: THREE.PerspectiveCamera,
  layout: HubTowerLayout,
  pitchRad: number
): void {
  const { towerX, lookAtX, lookAtY, camera: cam } = layout;
  const focusY = lookAtY * cam.lookAtYFactor;

  pivotScratch.set(towerX, focusY, 0);

  camRelScratch.set(cam.offsetX, cam.offsetY - focusY, cam.offsetZ);
  lookRelScratch.set(lookAtX - towerX, 0, 0);

  if (pitchRad > 0) {
    axisScratch.crossVectors(upScratch, camRelScratch);
    if (axisScratch.lengthSq() < 1e-8) {
      axisScratch.set(1, 0, 0);
    } else {
      axisScratch.normalize();
    }
    // Negative angle raises the camera (drag-up = higher vantage)
    camRelScratch.applyAxisAngle(axisScratch, -pitchRad);
    lookRelScratch.applyAxisAngle(axisScratch, -pitchRad);
  }

  camera.position.set(
    pivotScratch.x + camRelScratch.x,
    pivotScratch.y + camRelScratch.y,
    pivotScratch.z + camRelScratch.z
  );
  lookTargetScratch.copy(pivotScratch).add(lookRelScratch);
  camera.lookAt(lookTargetScratch);
}
