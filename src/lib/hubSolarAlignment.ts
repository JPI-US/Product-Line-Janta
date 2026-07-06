import * as THREE from "three";
import {
  HUB_TOWER,
  type HubTowerLayout,
} from "../components/three/hubTowerConfig";
import { getTowerYawFromSolarAzimuthDegrees } from "./solarTowerYaw";

const sunDirScratch = new THREE.Vector3();
const dirViewScratch = new THREE.Vector3();
const hubCameraScratch = new THREE.PerspectiveCamera();

/** Visual-only — sky sun disc height (does not affect tower tracking). */
const HUB_SKY_SUN_Y_CENTER = 0.57;
const HUB_SKY_SUN_Y_VERT_SCALE = 0.37;
const HUB_SKY_SUN_Y_CLAMP: [number, number] = [0.22, 0.92];

function getSkySunProjection(layout: HubTowerLayout) {
  return {
    yCenter: HUB_SKY_SUN_Y_CENTER,
    yVertScale: HUB_SKY_SUN_Y_VERT_SCALE,
    wrapHorizontal: false,
    xBias: 0,
    ...layout.skySun,
  };
}

export type HubSkySunProjection = {
  sunX: string;
  sunY: string;
  visible: boolean;
  /** 0–1 multiplier for glow when wrapping off-screen edges */
  glowMul: number;
};

function getFixedHubCamera(
  aspect: number,
  layout: HubTowerLayout = HUB_TOWER
): THREE.PerspectiveCamera {
  const { towerX, lookAtX, lookAtY, camera: cam } = layout;
  const camera = hubCameraScratch;
  camera.fov = cam.fov;
  camera.aspect = aspect;
  camera.near = 0.1;
  camera.far = 200;
  camera.position.set(towerX + cam.offsetX, cam.offsetY, cam.offsetZ);
  camera.lookAt(lookAtX, lookAtY * cam.lookAtYFactor, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return camera;
}

/** World-space unit vector from tower toward the sun. */
export function getSunDirectionFromSolar(
  azimuthDeg: number,
  altitudeDeg: number,
  target = sunDirScratch
): THREE.Vector3 {
  const az = (azimuthDeg * Math.PI) / 180;
  const alt = (altitudeDeg * Math.PI) / 180;
  const horizontal = Math.cos(alt);
  return target
    .set(
      Math.sin(az) * horizontal,
      Math.sin(alt),
      Math.cos(az) * horizontal
    )
    .normalize();
}

export function getHubTowerYawFromSolarAzimuth(azimuthDeg: number): number {
  return getTowerYawFromSolarAzimuthDegrees(azimuthDeg);
}

export function isHubSolarTracking(altitudeDeg: number | null): boolean {
  if (altitudeDeg == null) return true;
  return altitudeDeg >= HUB_TOWER.stowAltitudeDeg;
}

/** Fixed yaw when the sun is down — independent of last track angle. */
export function getHubTowerStowYaw(): number {
  return getTowerYawFromSolarAzimuthDegrees(HUB_TOWER.stowAzimuthDeg);
}

/**
 * Map solar position to hub sky CSS using the hub tower camera —
 * same fixed frame as HubTowerScene so the sun sits where the tower faces.
 */
export function projectSunToHubSky(
  azimuthDeg: number,
  altitudeDeg: number,
  viewportAspect: number,
  layout: HubTowerLayout = HUB_TOWER
): HubSkySunProjection {
  if (altitudeDeg < -2) {
    return { sunX: "50%", sunY: "108%", visible: false, glowMul: 0 };
  }

  const sunDir = getSunDirectionFromSolar(azimuthDeg, altitudeDeg);
  const camera = getFixedHubCamera(viewportAspect, layout);

  dirViewScratch.copy(sunDir).transformDirection(camera.matrixWorldInverse);

  const distXZ = Math.hypot(dirViewScratch.x, dirViewScratch.z);
  const horiz = Math.atan2(dirViewScratch.x, -dirViewScratch.z);
  const vert = Math.atan2(dirViewScratch.y, distXZ);

  const vertFovRad = (camera.fov * Math.PI) / 180;
  const horizFovRad =
    2 * Math.atan(Math.tan(vertFovRad / 2) * viewportAspect);

  const skySun = getSkySunProjection(layout);
  const y = THREE.MathUtils.clamp(
    skySun.yCenter - (vert / vertFovRad) * skySun.yVertScale,
    HUB_SKY_SUN_Y_CLAMP[0],
    HUB_SKY_SUN_Y_CLAMP[1]
  );
  const sunY = `${(y * 100).toFixed(2)}%`;

  const xRaw = 0.5 + (horiz / horizFovRad) * 0.5;
  const xBias = skySun.xBias ?? 0;
  const inFront = dirViewScratch.z <= 0.35;

  if (skySun.wrapHorizontal) {
    if (!inFront) {
      const xOff = dirViewScratch.x >= 0 ? 1.14 : -0.14;
      return {
        sunX: `${(xOff * 100).toFixed(2)}%`,
        sunY,
        visible: false,
        glowMul: 0,
      };
    }

    const edgeFade =
      THREE.MathUtils.smoothstep(1.1, 0.88, xRaw) *
      THREE.MathUtils.smoothstep(-0.1, 0.12, xRaw);
    const glowMul = edgeFade;

    return {
      sunX: `${((xRaw + xBias) * 100).toFixed(2)}%`,
      sunY,
      visible: glowMul > 0.02,
      glowMul,
    };
  }

  if (!inFront) {
    return { sunX: "50%", sunY: "108%", visible: false, glowMul: 0 };
  }

  const x = THREE.MathUtils.clamp(xRaw + xBias, 0.05, 0.95);

  return {
    sunX: `${(x * 100).toFixed(2)}%`,
    sunY,
    visible: true,
    glowMul: 1,
  };
}

export function getViewportAspect(): number {
  if (typeof window === "undefined") return 16 / 9;
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  return w / h;
}
