import * as THREE from "three";

/** Shared tuning for scroll-driven product hero */
export const PAGE_BG = "#f5f5f7";

/** Identical WebGL / tone-mapping settings for every product canvas */
export const TOWER_CANVAS_GL = {
  antialias: true,
  alpha: false,
  powerPreference: "default" as WebGLPowerPreference,
  failIfMajorPerformanceCaveat: false,
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.18,
} as const;

/** Product routes — same tone map, less fill rate than the hub / legacy dual-canvas page */
export const PRODUCT_CANVAS_GL = {
  ...TOWER_CANVAS_GL,
  antialias: false,
} as const;

/** Cap pixel ratio — same layout, less GPU fill on HiDPI displays */
export const TOWER_CANVAS_DPR: [number, number] = [1, 1];

/** World-space center of tower (panel seam / middle) */
const TOWER_FOCUS = { x: -1.6, y: 1.15, z: 0 } as const;

export const SCENE = {
  lookAt: { x: TOWER_FOCUS.x, y: 0.35, z: TOWER_FOCUS.z },
  lookAtEnd: { x: TOWER_FOCUS.x, y: 1.28, z: TOWER_FOCUS.z },
  tower: {
    offsetX: TOWER_FOCUS.x,
    offsetY: -3.4,
    offsetYEnd: -1.1,
    scale: 5.4,
    yawOffset: Math.PI,
    /** Idle pendulum rest — 0 matches the scroll intro end pose (seam toward camera) */
    idleYawCenter: 0,
    baseClearance: 0.05,
    prep: {
      meshOptimize: {
        topSurfaceSimplifyKeepRatio: 0.58,
        topSurfaceNormalMinY: 0.52,
      },
    },
  },
  sun: {
    azimuthStart: Math.PI * 0.5,
    azimuthEnd: Math.PI * 0.5,
    orbitRadius: 22,
    elevation: 6.5,
    visualRadius: 1.15,
    glowRadius: 5.2,
    coreColor: "#fffffa",
    glowColor: "#fff9ee",
    haloColor: "#fffdf6",
    color: "#fff6e8",
    glowOpacity: 0.36,
    intensity: 3.95,
    ambient: "#ebeae8",
    fill: "#fff8f0",
    rim: "#dde4f0",
    hemisphereSky: "#ebe9e6",
    hemisphereGround: "#454a48",
    point: "#fffaf6",
  },
  /** Neutral HDRI — avoids blue sky tint on PV panels; rotated to match sun (+X) */
  environment: {
    preset: "warehouse" as const,
    resolution: 256,
    intensity: 0.42,
    rotationY: -Math.PI * 0.5,
  },
  /**
   * Product scroll pages use `utility` (compact rig, no shadows).
   * `designer` is kept for hub montage / legacy full-quality paths.
   */
  lighting: {
    designer: {
      castShadow: true,
      shadowMapSize: 512,
      shadowIntensity: 0.38,
      ambientIntensity: 0.22,
      hemisphereIntensity: 0.44,
      keyIntensity: 3.95,
      fillIntensity: 0.88,
      rimIntensity: 1.05,
      pointIntensity: 0.68,
      sunDetail: "full" as const,
    },
    utility: {
      castShadow: false,
      ambientIntensity: 0.3,
      hemisphereIntensity: 0.56,
      /** Merged fill/rim character for a single bounce pass */
      hemisphereSky: "#f2f0ec",
      hemisphereGround: "#3d4341",
      keyIntensity: 4.05,
      environmentIntensity: 0.46,
      sunDetail: "compact" as const,
    },
  },
  floor: {
    y: -4.25,
    size: 48,
  },
  camera: {
    start: { x: 5.5, y: 1.75, z: 14.25 },
    end: { x: TOWER_FOCUS.x + 12.25, y: 1.38, z: TOWER_FOCUS.z },
    fovStart: 41,
    fovEnd: 40,
    splitPullback: 1.85,
    /** World-space camera/tower framing shift when the product column opens */
    splitComposeShift: 2.85,
    splitFov: 43,
  },
  scrollEase: 1.35,
  rotationScroll: { start: 0, end: 1 },
  scroll: {
    /** Intro spacers + room to slide the product view away and read the section below */
    pages: 11,
    /** Normalized offset where split / rotate ends; page flow begins after this */
    introEnd: 7 / 11,
    animationScrollEndRatio: 0.40,
  },
} as const;

export const ANIMATION_SCROLL_END =
  SCENE.scroll.introEnd * SCENE.scroll.animationScrollEndRatio;

/** Matches CameraRig at full split (infoReveal = 1), relative to tower focus X */
const SPLIT_INFO_SHIFT = SCENE.camera.splitComposeShift;
const SPLIT_LOOK_SHIFT = SPLIT_INFO_SHIFT * 0.9;

export const SPLIT_VIEW_CAMERA = {
  positionOffset: {
    x:
      SCENE.camera.end.x -
      SPLIT_INFO_SHIFT +
      SCENE.camera.splitPullback -
      SCENE.tower.offsetX,
    y: SCENE.camera.end.y,
    z: SCENE.camera.end.z,
  },
  lookAtOffset: {
    x: SCENE.lookAtEnd.x - SPLIT_LOOK_SHIFT - SCENE.tower.offsetX,
    y: SCENE.lookAtEnd.y,
    z: 0,
  },
  fov: SCENE.camera.splitFov,
} as const;

export function getSplitViewCamera(towerX: number) {
  const { positionOffset, lookAtOffset, fov } = SPLIT_VIEW_CAMERA;
  return {
    position: [
      towerX + positionOffset.x,
      positionOffset.y,
      positionOffset.z,
    ] as [number, number, number],
    lookAt: [
      towerX + lookAtOffset.x,
      lookAtOffset.y,
      lookAtOffset.z,
    ] as [number, number, number],
    fov,
  };
}
