import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE } from "./sceneConfig";
import { getSunPosition, getTowerLightTarget } from "./sceneScroll";

const sunPosScratch = new THREE.Vector3();
const sunDirScratch = new THREE.Vector3();
const rimPosScratch = new THREE.Vector3();
const fillPosScratch = new THREE.Vector3();

export type SunLightingVariant = "designer" | "utility";

export type SunLightingProps = {
  variant?: SunLightingVariant;
  towerX: number;
  getBlend: () => number;
  getPanelYawOffset: () => number;
  /** When false, skip per-frame light updates (hero scrolled off-screen) */
  isActive?: () => boolean;
  lookAtY?: number;
  /** Override world position (hub montage uses a lower horizon arc). */
  resolveSunPosition?: (
    blend: number,
    towerX: number,
    target: THREE.Vector3,
    panelYaw: number
  ) => THREE.Vector3;
  sunVisualScale?: number;
  sunGlowScale?: number;
  sunGlowOpacity?: number;
  /** Absolute world radii (hub montage — overrides SCENE.sun * scale). */
  sunVisualRadius?: number;
  sunGlowRadius?: number;
  showSunHalo?: boolean;
  /** Hide the visible sun sphere (glow + halo + core) while keeping the lights. */
  showSunSphere?: boolean;
};

/**
 * Shared sun rig — designer uses full lights; utility uses a lighter static
 * rig tuned to match the same premium look. No shadow maps — the compact
 * contact shadow at the tower base is the only shadow (janta-vision look).
 */
export function SunLighting({
  variant = "designer",
  towerX,
  getBlend,
  getPanelYawOffset,
  isActive,
  lookAtY = SCENE.lookAtEnd.y,
  resolveSunPosition,
  sunVisualScale = 1,
  sunGlowScale = 1,
  sunGlowOpacity,
  sunVisualRadius,
  sunGlowRadius,
  showSunHalo = true,
  showSunSphere = true,
}: SunLightingProps) {
  const profile = SCENE.lighting[variant];
  const designerProfile = SCENE.lighting.designer;
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const sunGroupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const lastKey = useRef<string | null>(null);
  const isDesigner = variant === "designer";
  const sunDetail = profile.sunDetail;

  const {
    visualRadius,
    glowRadius,
    color,
    coreColor,
    glowColor,
    haloColor,
    glowOpacity,
    ambient,
    fill,
    rim,
    hemisphereSky,
    hemisphereGround,
    point,
  } = SCENE.sun;

  const hemiSky =
    "hemisphereSky" in profile ? profile.hemisphereSky : hemisphereSky;
  const hemiGround =
    "hemisphereGround" in profile ? profile.hemisphereGround : hemisphereGround;

  const coreRadius = sunVisualRadius ?? visualRadius * sunVisualScale;
  const glowR = sunGlowRadius ?? glowRadius * sunGlowScale;

  const updateSun = (blend: number, panelYaw: number) => {
    const sunPos = resolveSunPosition
      ? resolveSunPosition(blend, towerX, sunPosScratch, panelYaw)
      : getSunPosition(blend, towerX, sunPosScratch, panelYaw);
    const focus = getTowerLightTarget(towerX, lookAtY);

    sunGroupRef.current?.position.copy(sunPos);

    sunDirScratch.copy(sunPos).sub(focus).normalize();
    rimPosScratch
      .copy(focus)
      .addScaledVector(sunDirScratch, -14)
      .add(new THREE.Vector3(0, 3.5, -2));
    fillPosScratch
      .copy(focus)
      .add(new THREE.Vector3(-sunDirScratch.z * 8, 5, sunDirScratch.x * 8));

    if (sunRef.current) {
      sunRef.current.position.copy(sunPos);
      sunRef.current.target.position.copy(focus);
      sunRef.current.target.updateMatrixWorld();
    }

    if (isDesigner && rimRef.current) {
      rimRef.current.position.copy(rimPosScratch);
      rimRef.current.target.position.copy(focus);
      rimRef.current.target.updateMatrixWorld();
    }
    if (isDesigner && fillRef.current) {
      fillRef.current.position.copy(fillPosScratch);
      fillRef.current.target.position.copy(focus);
      fillRef.current.target.updateMatrixWorld();
    }

    coreRef.current?.lookAt(focus);
    haloRef.current?.lookAt(focus);
    glowRef.current?.lookAt(focus);
  };

  useFrame(() => {
    if (isActive && !isActive()) return;
    const blend = getBlend();
    const panelYaw = getPanelYawOffset();
    const yawStep = isDesigner ? 0.006 : 0.012;
    const yawKey = Math.round(panelYaw / yawStep);
    const key = `${blend.toFixed(2)}:${yawKey}`;
    if (lastKey.current !== null && key === lastKey.current) return;
    lastKey.current = key;
    updateSun(blend, panelYaw);
  });

  return (
    <>
      <ambientLight intensity={profile.ambientIntensity} color={ambient} />

      {showSunSphere && <group ref={sunGroupRef}>
        <mesh ref={glowRef} scale={glowR}>
          <sphereGeometry
            args={[1, sunDetail === "full" ? 24 : 20, sunDetail === "full" ? 24 : 20]}
          />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={sunGlowOpacity ?? glowOpacity}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {sunDetail === "full" && showSunHalo && (
          <mesh ref={haloRef} scale={glowR * 0.52}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial
              color={haloColor}
              transparent
              opacity={glowOpacity * 0.5}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        )}
        <mesh ref={coreRef} scale={coreRadius}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={coreColor} toneMapped={false} />
        </mesh>
      </group>}

      <directionalLight
        ref={sunRef}
        intensity={profile.keyIntensity}
        color={color}
      />

      {isDesigner && (
        <>
          <directionalLight
            ref={fillRef}
            intensity={designerProfile.fillIntensity}
            color={fill}
          />
          <directionalLight
            ref={rimRef}
            intensity={designerProfile.rimIntensity}
            color={rim}
          />
          <pointLight
            position={[towerX + 3, 7, 10]}
            intensity={designerProfile.pointIntensity}
            color={point}
            distance={28}
            decay={2}
          />
        </>
      )}

      <hemisphereLight
        args={[hemiSky, hemiGround, profile.hemisphereIntensity]}
        position={[0, 28, 0]}
      />
    </>
  );
}
