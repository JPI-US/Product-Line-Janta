import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { SCENE } from "../../components/three/sceneConfig";
import {
  getWebsiteLightVisibility,
  getWebsiteSkyState,
  getWebsiteSunPosition,
  getWebsiteSunVisibility,
} from "./websiteDayCycle";
import { WEBSITE_SCENE } from "./websiteSceneConfig";
import { getWebsiteScrollOffset } from "./websiteScrollOffset";

const focus = new THREE.Vector3();
const sunPos = new THREE.Vector3();
const fillPos = new THREE.Vector3();
const warmFillPos = new THREE.Vector3();
const yellowPos = new THREE.Vector3();
const sunDir = new THREE.Vector3();
const fillScratch = new THREE.Vector3();
const warmFillScratch = new THREE.Vector3();

const SHADOW_MAP = 1024;
const SHADOW_BOUNDS = 14;

/** Cool-blue sun key + fill, subtle warm yellow glow fill */
export function WebsiteSunRig() {
  const sunGroup = useRef<THREE.Group>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const warmFillRef = useRef<THREE.DirectionalLight>(null);
  const yellowRef = useRef<THREE.DirectionalLight>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const shadowInit = useRef(false);
  const lastShadowMs = useRef(0);

  const { x: focusX, y: focusY } = WEBSITE_SCENE.towerFocus;
  const towerX = WEBSITE_SCENE.tower.offsetX;
  const { visualRadius } = SCENE.sun;
  const shadowIntensity = SCENE.lighting.designer.shadowIntensity;

  const coreScale = useMemo(() => visualRadius * 1.08, [visualRadius]);

  useFrame(() => {
    const offset = getWebsiteScrollOffset();
    const sky = getWebsiteSkyState(offset);
    const sunVis = getWebsiteSunVisibility(offset);
    const lightVis = getWebsiteLightVisibility(offset);

    focus.set(focusX, focusY, 0);
    getWebsiteSunPosition(offset, towerX, sunPos);
    sunDir.copy(sunPos).sub(focus).normalize();

    fillPos
      .copy(focus)
      .add(fillScratch.set(-sunDir.z * 10, 6, sunDir.x * 10));

    warmFillPos
      .copy(focus)
      .add(warmFillScratch.set(sunDir.z * 9, 2.8, -sunDir.x * 9));

    yellowPos.set(towerX + 11.5, 4.2, 14.5);

    const sunUp = sunVis > 0.05;

    if (sunGroup.current) {
      sunGroup.current.position.copy(sunPos);
      const scale = sunVis * sky.sunVisualScale;
      sunGroup.current.scale.setScalar(Math.max(scale, 0.001));
      sunGroup.current.visible = sunUp;
      sunGroup.current.lookAt(focus);
    }

    const coreMat = coreRef.current?.material as THREE.MeshBasicMaterial | undefined;

    if (coreMat) {
      coreMat.color.set(sky.sunCoreColor);
      coreMat.opacity = Math.min(1, sky.sunGlowOpacity * 0.98);
    }

    if (keyRef.current) {
      if (!shadowInit.current) {
        keyRef.current.shadow.autoUpdate = false;
        shadowInit.current = true;
      }
      keyRef.current.position.copy(sunPos);
      keyRef.current.target.position.copy(focus);
      keyRef.current.target.updateMatrixWorld();
      keyRef.current.intensity = sky.keyIntensity;
      keyRef.current.color.set(sky.keyColor);
      keyRef.current.visible = lightVis > 0.06;

      const shadowCam = keyRef.current.shadow.camera;
      shadowCam.position.copy(sunPos);
      shadowCam.lookAt(focus);
      shadowCam.updateProjectionMatrix();
      const now = performance.now();
      if (now - lastShadowMs.current > 80) {
        keyRef.current.shadow.needsUpdate = true;
        lastShadowMs.current = now;
      }
    }

    if (fillRef.current) {
      fillRef.current.position.copy(fillPos);
      fillRef.current.target.position.copy(focus);
      fillRef.current.target.updateMatrixWorld();
      fillRef.current.intensity = sky.fillIntensity;
      fillRef.current.color.set(sky.fillColor);
    }

    if (warmFillRef.current) {
      warmFillRef.current.position.copy(warmFillPos);
      warmFillRef.current.target.position.copy(focus);
      warmFillRef.current.target.updateMatrixWorld();
      warmFillRef.current.intensity = sky.accentIntensity;
      warmFillRef.current.color.set(sky.accentColor);
    }

    if (yellowRef.current) {
      yellowRef.current.position.copy(yellowPos);
      yellowRef.current.target.position.copy(focus);
      yellowRef.current.target.updateMatrixWorld();
      yellowRef.current.intensity = sky.yellowIntensity;
      yellowRef.current.color.set(sky.yellowColor);
    }

    if (ambient.current) {
      ambient.current.intensity = sky.ambientIntensity;
      ambient.current.color.set(sky.fillColor);
    }

    if (hemi.current) {
      hemi.current.color.set(sky.hemiSky);
      hemi.current.groundColor.set(sky.hemiGround);
      hemi.current.intensity = sky.hemiIntensity;
    }
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0} color="#1a2830" />
      <hemisphereLight ref={hemi} args={["#5a7488", "#141c24", 0]} position={[0, 28, 0]} />

      <directionalLight
        ref={keyRef}
        color="#4a90d4"
        intensity={0}
        visible={false}
        castShadow
        shadow-mapSize={[SHADOW_MAP, SHADOW_MAP]}
        shadow-camera-far={48}
        shadow-camera-left={-SHADOW_BOUNDS}
        shadow-camera-right={SHADOW_BOUNDS}
        shadow-camera-top={SHADOW_BOUNDS}
        shadow-camera-bottom={-SHADOW_BOUNDS}
        shadow-bias={-0.00012}
        shadow-normalBias={0.018}
        shadow-intensity={shadowIntensity}
      />
      <directionalLight ref={fillRef} color="#3a6898" intensity={0} />
      <directionalLight ref={warmFillRef} color="#ffe9b8" intensity={0} />
      <directionalLight ref={yellowRef} color="#ffbf14" intensity={0} />

      <group ref={sunGroup} visible={false}>
        <mesh ref={coreRef} scale={coreScale}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color="#fff5e6"
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </>
  );
}
