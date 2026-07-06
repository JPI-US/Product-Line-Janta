import { SCENE } from "../../components/three/sceneConfig";
import { HUB_TOWER, type HubTowerLayout } from "../../components/three/hubTowerConfig";
import { WEBSITE_SCENE } from "./websiteSceneConfig";

const { tower, camera, fog } = WEBSITE_SCENE;

/**
 * Marketing hero framing — DSR designer tower, shifted right.
 */
export const WEBSITE_HUB_TOWER = {
  ...HUB_TOWER,
  towerX: tower.offsetX,
  lookAtX: camera.lookAt.x,
  lookAtY: SCENE.lookAtEnd.y,
  scaleMul: (5.4 / SCENE.tower.scale) * 1.2,
  yOffset: tower.offsetY,
  yawLerp: 0.3,
  fog: { near: fog.near * 0.72, far: fog.far * 0.52 },
  skySun: { yCenter: 0.4, yVertScale: 0.5, wrapHorizontal: true, xBias: 0.055 },
  camera: {
    offsetX: camera.position.x - tower.offsetX,
    offsetY: camera.position.y,
    offsetZ: camera.position.z,
    lookAtYFactor: camera.lookAt.y / SCENE.lookAtEnd.y,
    fov: camera.fov,
  },
} satisfies HubTowerLayout;
