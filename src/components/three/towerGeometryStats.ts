import * as THREE from "three";

export function countGeometryTriangles(geometry: THREE.BufferGeometry): number {
  const index = geometry.index;
  if (index) return Math.floor(index.count / 3);
  const position = geometry.getAttribute("position");
  return position ? Math.floor(position.count / 3) : 0;
}

export function countObjectTriangles(root: THREE.Object3D): number {
  let total = 0;
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      total += countGeometryTriangles((child as THREE.Mesh).geometry);
    }
  });
  return total;
}
