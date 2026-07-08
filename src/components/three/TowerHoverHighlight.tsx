import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const HOVER_EMISSIVE = new THREE.Color("#ffbf14");
/** Near-black PV glass amplifies additive emissive — keep the ramp subtle */
const BASE_INTENSITY = 0;
const HOVER_INTENSITY = 0.055;
const RAYCAST_INTERVAL_MS = 66;
const HOVER_CLASS = "tower-part-hover";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type EmissiveMaterial = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

function emissiveMaterialOf(mesh: THREE.Mesh): EmissiveMaterial | null {
  const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  if (!mat || !("emissive" in mat)) return null;
  return mat as EmissiveMaterial;
}

/**
 * Hover highlight for the merged tower parts (panels / structure buckets).
 * Listens on window pointer moves — the HTML drag surface sits above the
 * canvas, so R3F's own pointer events never reach the meshes. Raycasts are
 * throttled and the emissive ramp drives `invalidate()` so it stays
 * compatible with `frameloop="demand"`.
 */
export function TowerHoverHighlight({
  targetRef,
}: {
  targetRef: React.RefObject<THREE.Object3D | null>;
}) {
  const { camera, gl, invalidate } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useRef(new THREE.Vector2(2, 2));
  const pointerDirty = useRef(false);
  const lastCast = useRef(0);
  const hovered = useRef<EmissiveMaterial | null>(null);
  const touched = useRef(new Set<EmissiveMaterial>());

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        pointer.current.set(2, 2); // off-canvas — clears the highlight
      } else {
        pointer.current.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
      }
      pointerDirty.current = true;
      invalidate();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove(HOVER_CLASS);
    };
  }, [gl, invalidate]);

  // Restore any touched materials when unmounting
  useEffect(() => {
    const set = touched.current;
    return () => {
      for (const mat of set) {
        mat.emissiveIntensity = 0;
        mat.emissive.setRGB(0, 0, 0);
      }
    };
  }, []);

  useFrame(() => {
    const root = targetRef.current;
    if (!root) return;

    const now = performance.now();
    if (pointerDirty.current && now - lastCast.current >= RAYCAST_INTERVAL_MS) {
      pointerDirty.current = false;
      lastCast.current = now;

      let nextMat: EmissiveMaterial | null = null;
      if (pointer.current.x <= 1) {
        raycaster.setFromCamera(pointer.current, camera);
        const hits = raycaster.intersectObject(root, true);
        const hit = hits.find((h) => (h.object as THREE.Mesh).isMesh);
        if (hit) {
          const mesh = hit.object as THREE.Mesh;
          const mat = emissiveMaterialOf(mesh);
          if (mat) {
            nextMat = mat;
            if (!touched.current.has(mat)) {
              touched.current.add(mat);
              mat.emissive.copy(HOVER_EMISSIVE);
              mat.emissiveIntensity = 0;
            }
          }
        }
      }

      if (nextMat !== hovered.current) {
        hovered.current = nextMat;
        document.documentElement.classList.toggle(HOVER_CLASS, !!nextMat);
      }
    }

    // Ease every touched material toward its target intensity
    let animating = false;
    const snap = reducedMotion();
    for (const mat of touched.current) {
      const target = mat === hovered.current ? HOVER_INTENSITY : BASE_INTENSITY;
      const current = mat.emissiveIntensity;
      const next = snap
        ? target
        : THREE.MathUtils.lerp(current, target, 0.16);
      if (Math.abs(next - target) < 0.004) {
        mat.emissiveIntensity = target;
      } else {
        mat.emissiveIntensity = next;
        animating = true;
      }
    }
    if (animating) invalidate();
  });

  return null;
}
