import { PAGE_BG, SCENE } from "../../components/three/sceneConfig";

/** World X for tower base */
const TOWER_X = 7.2;

/**
 * How far west of the tower the camera looks. More negative = tower reads further
 * right on screen (original was -1.2, which left a large empty band on the right).
 */
const LOOK_AT_X_OFFSET = -4.6;

/** Full 360° (2π rad) lap — starts west, orbits once around the tower */
const SUN_AZIMUTH_START = Math.PI * 1.5;
const SUN_AZIMUTH_END = SUN_AZIMUTH_START + Math.PI * 2;

/** Marketing 3D scene — DSR designer over a seamless sky gradient */
export const WEBSITE_SCENE = {
  page: PAGE_BG,
  tower: {
    offsetX: TOWER_X,
    offsetY: SCENE.tower.offsetYEnd - 1.55,
    scale: 7,
    baseClearance: SCENE.tower.baseClearance,
    panelNormalYaw: SCENE.tower.yawOffset,
  },
  towerFocus: { x: TOWER_X - 0.85, y: 1.05, z: 0 },
  sun: {
    orbitRadius: 22,
    azimuthStart: SUN_AZIMUTH_START,
    azimuthEnd: SUN_AZIMUTH_END,
    /** Below horizon at start, rises to cruise altitude and holds through the sweep */
    elevationStart: -4,
    elevationEnd: 9.5,
  },
  camera: {
    position: { x: 13.8, y: 1.55, z: 13.8 },
    fov: 36,
    lookAt: { x: TOWER_X + LOOK_AT_X_OFFSET, y: 0.35, z: 0 },
  },
  fog: { near: 18, far: 72, color: PAGE_BG },
} as const;
