import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Large ground shadow receiver whose shadow fades out radially toward the
 * horizon instead of cutting off at the plane edge. A patched ShadowMaterial
 * multiplies opacity by a smoothstep falloff on the distance from the plane
 * center (in local plane units), so towers read as grounded on the marketing
 * gradient without a visible receiver rectangle.
 */
export function HorizonFadeShadowPlane({
  position,
  size = 48,
  opacity = 0.32,
  /** Radial fraction where the fade begins (0–1 of half-size). */
  fadeStart = 0.28,
  renderOrder = -1,
  /** Optional per-frame opacity driver (e.g. day/night scroll blend). */
  getOpacity,
}: {
  position: [number, number, number];
  size?: number;
  opacity?: number;
  fadeStart?: number;
  renderOrder?: number;
  getOpacity?: () => number;
}) {
  const material = useMemo(() => {
    const mat = new THREE.ShadowMaterial({ transparent: true, opacity });
    mat.depthWrite = false;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uFadeStart = { value: fadeStart };
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "varying vec2 vPlanePos;\n#include <common>",
        )
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\n\tvPlanePos = position.xy;",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "varying vec2 vPlanePos;\nuniform float uFadeStart;\n#include <common>",
        )
        .replace(
          "gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );",
          `float planeHalf = ${(size / 2).toFixed(1)};
	float horizonFade = 1.0 - smoothstep( uFadeStart, 1.0, length( vPlanePos ) / planeHalf );
	gl_FragColor = vec4( color, opacity * horizonFade * ( 1.0 - getShadowMask() ) );`,
        );
    };
    return mat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, fadeStart]);

  material.opacity = opacity;

  const materialRef = useRef(material);
  materialRef.current = material;
  useFrame(() => {
    if (!getOpacity) return;
    materialRef.current.opacity = getOpacity();
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={position}
      receiveShadow
      renderOrder={renderOrder}
      material={material}
    >
      <planeGeometry args={[size, size]} />
    </mesh>
  );
}
