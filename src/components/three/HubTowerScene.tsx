import { useGLTF } from "@react-three/drei";
import { invalidate, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { getChooserSkyPeriodForDate } from "../../data/hubChooserSky";
import type { SkyPeriod } from "../../data/hubChooserSky";
import type { HubWeatherResult } from "../../lib/hubWeatherFetch";
import {
  getHubTowerStowYaw,
  getHubTowerYawFromSolarAzimuth,
  getSunDirectionFromAzimuthDegrees,
  isHubSolarTracking,
} from "../../lib/hubTowerAzimuth";
import {
  sampleHubSun,
  type HubSolarCoords,
} from "../../lib/hubSolarSample";
import { HUB_TOWER, type HubTowerLayout, type HubTowerScrollDriver } from "./hubTowerConfig";
import {
  getHubTowerContactShadowTexture,
  measureHubTowerContactShadowFootprint,
  type HubTowerContactShadowFootprint,
} from "./hubTowerContactShadow";
import {
  applyHubTowerMaterials,
  syncHubTowerMaterials,
} from "./hubTowerSilhouette";
import {
  applyHubTowerEnvMap,
  createHubTowerMaterials,
  type HubTowerEnvironment,
  readHubTowerEnvironment,
} from "./hubTowerEnvironment";
import { HubTowerSkyEnvMap } from "./hubTowerSkyEnvMap";
import { SCENE } from "./sceneConfig";
import { syncSceneEnvironmentMaps } from "./towerMaterials";
import { DESIGNER_MODEL_URL, UTILITY_MODEL_URL } from "./towerModelUrls";
import {
  getCachedTowerScene,
  getDesignerTowerPrepConfig,
  isTowerScenePrepared,
  prepareTowerSceneFromGltf,
  TOWER_PREP_KEYS,
  type TowerPrepConfig,
} from "./towerScenePrep";
import { useTowerScenePrepared } from "./useTowerScenePrepared";
import { clampWebsiteCameraPitch, websiteTowerOrbit } from "../../marketing/website/websiteTowerOrbit";
import { applyWebsiteHeroCameraPitch } from "../../marketing/website/websiteHeroCamera";
import { lerpTowerYaw } from "../../marketing/website/websiteHeroScroll";
import { markWebsiteHeroTowerMeshMounted } from "../../marketing/website/websiteHeroTowerMounted";
import { WEBSITE_HERO_NIGHT_CLEAR } from "../../marketing/website/websiteHeroNightSky";

export type HubTowerModelVariant = "designer" | "utility";
export type HubTowerPerfMode = "default" | "marketing";

type HubTowerSceneProps = {
  coords: HubSolarCoords | null;
  previewDate: Date | null;
  weather: HubWeatherResult;
  skyPeriod: SkyPeriod | null;
  /** When set, tower yaw + key light follow scroll instead of live solar tracking */
  scrollDriver?: HubTowerScrollDriver;
  /** Camera + tower placement — defaults to product hub */
  layout?: HubTowerLayout;
  /** GLB source — marketing hero uses the LFM utility tower */
  modelVariant?: HubTowerModelVariant;
  /** Throttles env/material work for scroll-heavy views */
  perfMode?: HubTowerPerfMode;
  /** Soft contact shadow beneath the tower base */
  groundShadow?: boolean;
};

function getHubTowerModelConfig(variant: HubTowerModelVariant): {
  prepKey: string;
  modelUrl: string;
  prepConfig: TowerPrepConfig;
} {
  if (variant === "utility") {
    return {
      prepKey: TOWER_PREP_KEYS.utility,
      modelUrl: UTILITY_MODEL_URL,
      prepConfig: {
        scale: SCENE.tower.scale,
        baseClearance: SCENE.tower.baseClearance,
        skipMeshOptimize: true,
      },
    };
  }
  return {
    prepKey: TOWER_PREP_KEYS.designer,
    modelUrl: DESIGNER_MODEL_URL,
    prepConfig: getDesignerTowerPrepConfig(),
  };
}

function getHubTowerPerfTimings(mode: HubTowerPerfMode) {
  if (mode === "marketing") {
    return {
      envRefreshMs: 8000,
      materialRefreshMs: 4000,
      trackingInvalidateMs: 1000 / 5,
      frameInvalidateMs: 0,
      skyEnvMap: { width: 64, height: 32, updateIntervalMs: 8000 },
    };
  }
  return {
    envRefreshMs: 720,
    materialRefreshMs: 1000 / 12,
    trackingInvalidateMs: 1000 / 12,
    frameInvalidateMs: 0,
    skyEnvMap: undefined,
  };
}

export function HubTowerScene({
  coords,
  previewDate,
  weather,
  skyPeriod,
  scrollDriver,
  layout = HUB_TOWER,
  modelVariant = "designer",
  perfMode = "default",
  groundShadow = false,
}: HubTowerSceneProps) {
  const modelConfig = useMemo(
    () => getHubTowerModelConfig(modelVariant),
    [modelVariant]
  );
  const perf = useMemo(() => getHubTowerPerfTimings(perfMode), [perfMode]);
  const marketingPerf = perfMode === "marketing";
  const prepKey = modelConfig.prepKey;
  const coordsRef = useRef(coords);
  coordsRef.current = coords;
  const previewDateRef = useRef(previewDate);
  previewDateRef.current = previewDate;
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const { camera, gl, scene: r3fScene, size } = useThree();
  const { scene } = useGLTF(modelConfig.modelUrl);
  const ready = useTowerScenePrepared(prepKey);
  const prepared = ready ? getCachedTowerScene(prepKey) : null;

  const groupRef = useRef<THREE.Group>(null);
  const cloneRef = useRef<THREE.Object3D | null>(null);
  const [groundY, setGroundY] = useState<number | null>(null);
  const [shadowFootprint, setShadowFootprint] =
    useState<HubTowerContactShadowFootprint | null>(null);
  const contactShadowTex = useMemo(() => getHubTowerContactShadowTexture(), []);
  const contactMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const materialsRef = useRef(createHubTowerMaterials());
  const targetYawRef = useRef(0);
  /** Unwrapped marketing yaw — stays in sync with the 360° LUT (not mod 2π) */
  const commandedYawRef = useRef<number | null>(null);
  const sunDirRef = useRef(new THREE.Vector3(0.6, 0.4, 0.7));
  const sunTargetRef = useRef(new THREE.Vector3(0.6, 0.4, 0.7));
  const nightFillDirRef = useRef(new THREE.Vector3(0.25, 0.85, 0.35));
  const fogColorScratch = useRef(new THREE.Color());
  const skyEnvRef = useRef<HubTowerSkyEnvMap | null>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const lightScratch = useRef({
    zenith: new THREE.Color(),
    mid: new THREE.Color(),
    horizon: new THREE.Color(),
    ground: new THREE.Color(),
    sun: new THREE.Color(),
  });
  const envRef = useRef<HubTowerEnvironment | null>(null);
  const lastEnvUpdateRef = useRef(0);
  const lastMatUpdateRef = useRef(0);
  const lastFogColorRef = useRef("#3a2858");
  const lastFrameInvalidateMs = useRef(0);
  const lastScrollBlendRef = useRef(-1);
  const lastFrameScrollBlendRef = useRef(-1);
  const ENV_REFRESH_MS = perf.envRefreshMs;
  const MATERIAL_REFRESH_MS = perf.materialRefreshMs;
  const TRACKING_INVALIDATE_MS = perf.trackingInvalidateMs;
  const FRAME_INVALIDATE_MS = perf.frameInvalidateMs;
  const lastTrackingInvalidateMs = useRef(0);
  const sunIntensityRef = useRef(0.22);
  const fillIntensityRef = useRef(0.14);
  const meshPaintFrames = useRef(0);
  useEffect(() => {
    if (!scene || isTowerScenePrepared(prepKey)) return;
    prepareTowerSceneFromGltf(scene, prepKey, modelConfig.prepConfig);
  }, [modelConfig.prepConfig, prepKey, scene]);

  useLayoutEffect(() => {
    if (!prepared || !groupRef.current) return;
    const group = groupRef.current;
    if (cloneRef.current) {
      group.remove(cloneRef.current);
      cloneRef.current = null;
    }
    const clone = prepared.root.clone(true);
    applyHubTowerMaterials(clone, materialsRef.current, { castShadow: false });
    cloneRef.current = clone;
    group.add(clone);
    const tower = layoutRef.current;
    group.scale.setScalar(tower.scaleMul);
    group.position.set(
      tower.towerX,
      prepared.baseLift + tower.yOffset,
      0
    );
    group.updateWorldMatrix(true, true);
    const fitted = new THREE.Box3().setFromObject(group);
    setGroundY(fitted.min.y - 0.015);
    setShadowFootprint(measureHubTowerContactShadowFootprint(group));
    meshPaintFrames.current = 0;
    if (marketingPerf) {
      markWebsiteHeroTowerMeshMounted();
    }
    invalidate();
    requestAnimationFrame(() => invalidate());
  }, [prepared]);

  useEffect(() => {
    skyEnvRef.current = new HubTowerSkyEnvMap(gl, perf.skyEnvMap);
    return () => {
      skyEnvRef.current?.dispose();
      skyEnvRef.current = null;
    };
  }, [gl, perf.skyEnvMap]);

  useEffect(() => {
    gl.setClearColor(WEBSITE_HERO_NIGHT_CLEAR, 0);
    const fogColor =
      typeof document !== "undefined"
        ? getComputedStyle(document.documentElement)
            .getPropertyValue("--hub-horizon")
            .trim() || "#3a2858"
        : "#3a2858";
    r3fScene.fog = new THREE.Fog(
      new THREE.Color(fogColor),
      layout.fog.near,
      layout.fog.far
    );

    const { towerX, lookAtX, lookAtY, camera: cam } = layout;
    camera.position.set(
      towerX + cam.offsetX,
      cam.offsetY,
      cam.offsetZ
    );
    camera.lookAt(lookAtX, lookAtY * cam.lookAtYFactor, 0);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = cam.fov;
      camera.aspect = size.width / Math.max(size.height, 1);
      camera.updateProjectionMatrix();
    }

    return () => {
      r3fScene.fog = null;
    };
  }, [camera, gl, layout, r3fScene, size.height, size.width]);

  useEffect(() => {
    invalidate();
  }, [coords, previewDate, weather.kind, weather.intensity, skyPeriod]);

  const scrollDriverRef = useRef(scrollDriver);
  scrollDriverRef.current = scrollDriver;

  useFrame((state) => {
    if (!groupRef.current || document.visibilityState === "hidden") return;

    const scrollDrive = scrollDriverRef.current;
    let tracking: boolean;

    if (scrollDrive) {
      targetYawRef.current = scrollDrive.getYaw();
      scrollDrive.getSunDirection(sunTargetRef.current);
      sunDirRef.current.lerp(sunTargetRef.current, 0.055);
      tracking = scrollDrive.isAnimating();
    } else {
      const { azimuthDeg, altitudeDeg } = sampleHubSun(
        coordsRef.current,
        previewDateRef.current
      );
      tracking =
        coordsRef.current != null && isHubSolarTracking(altitudeDeg);

      if (tracking) {
        targetYawRef.current = getHubTowerYawFromSolarAzimuth(azimuthDeg);
        sunDirRef.current.copy(
          getSunDirectionFromAzimuthDegrees(azimuthDeg, altitudeDeg)
        );
      } else if (coordsRef.current != null) {
        targetYawRef.current = getHubTowerStowYaw();
      }
    }

    const yawDelta = Math.abs(
      THREE.MathUtils.euclideanModulo(
        targetYawRef.current - groupRef.current.rotation.y + Math.PI,
        Math.PI * 2
      ) - Math.PI
    );
    const orbitDragging = scrollDrive?.getOrbitDragging?.() ?? false;
    const yawLerp = scrollDrive
      ? orbitDragging
        ? 1
        : 0.14
      : tracking
        ? yawDelta > 0.35
          ? 0.16
          : layoutRef.current.yawLerp
        : 0.11;

    if (scrollDrive) {
      if (commandedYawRef.current === null) {
        commandedYawRef.current = targetYawRef.current;
      }
      if (orbitDragging) {
        commandedYawRef.current = targetYawRef.current;
      } else {
        commandedYawRef.current = lerpTowerYaw(
          commandedYawRef.current,
          targetYawRef.current,
          yawLerp
        );
      }
      groupRef.current.rotation.y = commandedYawRef.current;
      websiteTowerOrbit.lastRenderedYaw = commandedYawRef.current;
    } else {
      commandedYawRef.current = null;
      groupRef.current.rotation.y = orbitDragging
        ? targetYawRef.current
        : THREE.MathUtils.lerp(
            groupRef.current.rotation.y,
            targetYawRef.current,
            yawLerp
          );
    }

    if (camera instanceof THREE.PerspectiveCamera) {
      const nextAspect = size.width / Math.max(size.height, 1);
      if (Math.abs(camera.aspect - nextAspect) > 0.001) {
        camera.aspect = nextAspect;
        camera.updateProjectionMatrix();
      }
      if (scrollDrive) {
        applyWebsiteHeroCameraPitch(
          camera,
          layoutRef.current,
          clampWebsiteCameraPitch(websiteTowerOrbit.pitchOffset)
        );
      }
    }

    const nowMs = state.clock.elapsedTime * 1000;

    const scrollBlend = scrollDrive?.getScrollBlend?.();
    const scrollBlendDelta =
      scrollBlend != null
        ? Math.abs(scrollBlend - lastFrameScrollBlendRef.current)
        : 0;
    if (scrollBlend != null) {
      lastFrameScrollBlendRef.current = scrollBlend;
    }

    const scrollAnimating = scrollDrive?.isAnimating() ?? false;
    const shouldRefreshEnv =
      envRef.current == null ||
      (scrollDrive
        ? !scrollAnimating &&
          scrollBlendDelta <= 0.0005 &&
          nowMs - lastEnvUpdateRef.current >= ENV_REFRESH_MS
        : nowMs - lastEnvUpdateRef.current >= ENV_REFRESH_MS);

    if (shouldRefreshEnv) {
      const period =
        scrollBlend != null
          ? scrollBlend < 0.2
            ? "night"
            : scrollBlend > 0.8
              ? "day"
              : "dawn"
          : scrollDrive?.getSkyPeriod?.() ??
            skyPeriod ??
            getChooserSkyPeriodForDate(previewDateRef.current ?? new Date());
      envRef.current = readHubTowerEnvironment(
        period,
        marketingPerf ? "clear" : weather.kind,
        sunDirRef.current,
        marketingPerf ? 0 : weather.intensity,
        scrollBlend,
        scrollDrive?.getSkyStops?.()
      );
      if (scrollBlend != null) {
        lastScrollBlendRef.current = scrollBlend;
      }
      lastEnvUpdateRef.current = nowMs;
      lastFogColorRef.current = envRef.current.horizon;
    }

    const env = envRef.current;
    if (!env) return;
    const shouldRefreshMaterials =
      !scrollAnimating && nowMs - lastMatUpdateRef.current >= MATERIAL_REFRESH_MS;
    if (shouldRefreshMaterials) {
      syncHubTowerMaterials(
        materialsRef.current,
        env,
        scrollDrive ? 0.02 : undefined
      );
      lastMatUpdateRef.current = nowMs;
    }

    if (shouldRefreshEnv) {
      if (r3fScene.environment) {
        syncSceneEnvironmentMaps(r3fScene.environment);
      }
      const envMap = skyEnvRef.current?.update(r3fScene, env, sunDirRef.current);
      if (envMap) {
        applyHubTowerEnvMap(materialsRef.current, envMap);
      }
    }

    if (shouldRefreshMaterials) {
      const ls = lightScratch.current;
      ls.zenith.set(env.zenith);
      ls.mid.set(env.mid);
      ls.horizon.set(env.horizon);
      ls.ground.copy(ls.horizon).multiplyScalar(0.42);
      ls.sun.set("#fff6ea").lerp(ls.horizon, 0.35);

      if (hemiRef.current) {
        hemiRef.current.color.lerp(ls.mid, scrollDrive ? 0.028 : 0.07);
        hemiRef.current.groundColor.lerp(ls.ground, scrollDrive ? 0.028 : 0.07);
      }
    }

    const scrollLightBlend =
      scrollBlend != null
        ? THREE.MathUtils.smoothstep(scrollBlend, 0.02, 0.94)
        : null;

    if (sunRef.current) {
      const ls = lightScratch.current;
      sunRef.current.color.lerp(ls.sun, scrollDrive ? 0.03 : 0.06);
      if (scrollLightBlend != null) {
        const targetIntensity = THREE.MathUtils.lerp(0.22, 1.05, scrollLightBlend);
        sunIntensityRef.current = THREE.MathUtils.lerp(
          sunIntensityRef.current,
          targetIntensity,
          0.045
        );
        sunRef.current.intensity = sunIntensityRef.current;
        sunRef.current.position.copy(sunDirRef.current).multiplyScalar(16);
      } else if (tracking) {
        sunRef.current.intensity = 1.05;
        sunRef.current.position
          .copy(sunDirRef.current)
          .multiplyScalar(16);
      } else {
        sunRef.current.intensity = 0.22;
        sunRef.current.position
          .copy(nightFillDirRef.current)
          .multiplyScalar(14);
      }
    }
    if (fillRef.current) {
      const ls = lightScratch.current;
      fillRef.current.color.lerp(ls.zenith, scrollDrive ? 0.03 : 0.06);
      if (scrollLightBlend != null) {
        const targetFill = THREE.MathUtils.lerp(0.14, 0.28, scrollLightBlend);
        fillIntensityRef.current = THREE.MathUtils.lerp(
          fillIntensityRef.current,
          targetFill,
          0.045
        );
        fillRef.current.intensity = fillIntensityRef.current;
        fillRef.current.position.set(
          -sunDirRef.current.x * 9,
          5,
          -sunDirRef.current.z * 9
        );
      } else if (tracking) {
        fillRef.current.intensity = 0.28;
        fillRef.current.position.set(
          -sunDirRef.current.x * 9,
          5,
          -sunDirRef.current.z * 9
        );
      } else {
        fillRef.current.intensity = 0.14;
        fillRef.current.position.set(-3, 8, -6);
      }
    }

    const fog = r3fScene.fog;
    if (fog instanceof THREE.Fog) {
      fog.color.lerp(
        fogColorScratch.current.setStyle(lastFogColorRef.current),
        scrollDrive ? 0.022 : 0.04
      );
    }

    if (groundShadow && contactMatRef.current) {
      const opacity =
        scrollLightBlend != null
          ? THREE.MathUtils.lerp(0.36, 0.56, scrollLightBlend)
          : tracking
            ? 0.5
            : 0.32;
      const targetOpacity = opacity;
      contactMatRef.current.opacity = THREE.MathUtils.lerp(
        contactMatRef.current.opacity,
        targetOpacity,
        scrollDrive ? 0.06 : 0.12
      );
    }

    const nowInvalidate = performance.now();
    const needsTrackingFrame =
      tracking &&
      nowInvalidate - lastTrackingInvalidateMs.current >= TRACKING_INVALIDATE_MS;
    const scrollSettled =
      scrollDrive &&
      !scrollAnimating &&
      yawDelta <= 0.012 &&
      scrollBlendDelta <= 0;

    const shouldRedraw = scrollDrive
      ? shouldRefreshEnv ||
        meshPaintFrames.current < 4 ||
        (!scrollSettled &&
          (needsTrackingFrame ||
            yawDelta > 0.0015 ||
            scrollAnimating ||
            scrollBlendDelta > 0.002))
      : needsTrackingFrame ||
        yawDelta > 0.0015 ||
        scrollAnimating ||
        scrollBlendDelta > 0.002 ||
        shouldRefreshEnv ||
        shouldRefreshMaterials ||
        meshPaintFrames.current < 4;

    if (
      shouldRedraw &&
      Number.isFinite(FRAME_INVALIDATE_MS) &&
      (FRAME_INVALIDATE_MS === 0 ||
        nowInvalidate - lastFrameInvalidateMs.current >= FRAME_INVALIDATE_MS)
    ) {
      if (needsTrackingFrame) {
        lastTrackingInvalidateMs.current = nowInvalidate;
      }
      lastFrameInvalidateMs.current = nowInvalidate;
      if (cloneRef.current) {
        meshPaintFrames.current += 1;
      }
      invalidate();
    }
  });

  const sun = sunDirRef.current;

  return (
    <>
      <ambientLight intensity={0.34} color="#d0d8e4" />
      <hemisphereLight
        ref={hemiRef}
        color="#e8ecf4"
        groundColor="#2c2e34"
        intensity={0.46}
      />
      <directionalLight
        ref={sunRef}
        position={sun.clone().multiplyScalar(16)}
        intensity={1.05}
        color="#fff6ea"
      />
      <directionalLight
        ref={fillRef}
        position={[-sun.x * 9, 5, -sun.z * 9]}
        intensity={0.28}
        color="#b8c8e0"
      />
      {groundShadow && groundY != null && shadowFootprint ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[layout.towerX, groundY + 0.003, 0]}
          renderOrder={-2}
        >
          <planeGeometry
            args={[shadowFootprint.width, shadowFootprint.depth]}
          />
          <meshBasicMaterial
            ref={contactMatRef}
            map={contactShadowTex}
            transparent
            opacity={0.44}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}
      <group ref={groupRef} />
    </>
  );
}
