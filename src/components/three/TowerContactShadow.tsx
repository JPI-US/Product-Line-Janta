import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getHubTowerContactShadowTexture } from "./hubTowerContactShadow";

/** janta-vision Tower3D contact shadow tuning (warm charcoal texture) */
export const TOWER_CONTACT_SHADOW = {
  /** Tight disc — the dark core must hug the pedestal, not haze the ground */
  scale: 6,
  /** Visible at night without reading as a hole; deeper in daylight */
  opacityMin: 0.38,
  opacityMax: 0.72,
  /** Matches janta-vision sampleLighting shadowOpacity ramp */
  opacityBlendStart: 0.15,
  opacityBlendEnd: 0.7,
} as const;

export function sampleTowerContactShadowOpacity(blend: number): number {
  const t = THREE.MathUtils.smoothstep(
    blend,
    TOWER_CONTACT_SHADOW.opacityBlendStart,
    TOWER_CONTACT_SHADOW.opacityBlendEnd
  );
  return THREE.MathUtils.lerp(
    TOWER_CONTACT_SHADOW.opacityMin,
    TOWER_CONTACT_SHADOW.opacityMax,
    t
  );
}

type TowerContactShadowProps = {
  position: [number, number, number];
  /** When set, opacity follows scroll day-cycle. */
  getOpacityBlend?: () => number | null;
  /** Static opacity when no scroll driver is provided */
  opacity?: number;
  /** World-space width of the shadow disc (janta-vision scale=9) */
  width?: number;
  depth?: number;
};

/**
 * Soft oval ground contact shadow — radial-gradient texture plane.
 * More reliable than drei ContactShadows on our transparent hero canvas and
 * with matrixAutoUpdate-frozen tower meshes.
 */
export function TowerContactShadow({
  position,
  getOpacityBlend,
  opacity = (TOWER_CONTACT_SHADOW.opacityMin + TOWER_CONTACT_SHADOW.opacityMax) / 2,
  width = TOWER_CONTACT_SHADOW.scale,
  depth = TOWER_CONTACT_SHADOW.scale * 0.82,
}: TowerContactShadowProps) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const texture = useMemo(() => getHubTowerContactShadowTexture(), []);

  useFrame(() => {
    if (!matRef.current || !getOpacityBlend) return;
    const blend = getOpacityBlend();
    if (blend == null) return;
    const target = sampleTowerContactShadowOpacity(blend);
    matRef.current.opacity = THREE.MathUtils.lerp(
      matRef.current.opacity,
      target,
      0.14
    );
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={position}
      renderOrder={-2}
    >
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
