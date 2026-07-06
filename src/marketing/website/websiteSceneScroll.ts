import {

  getTowerYawFromSolarAzimuthDegrees,

  solarAzimuthDegFromDirection,

} from "../../lib/solarTowerYaw";

import type { HubSolarCoords } from "../../lib/hubSolarSample";

import {

  getWebsiteScrollSolarState,

  type WebsiteScrollSolarState,

} from "./websiteScrollSolar";

import { getWebsiteSunPosition } from "./websiteDayCycle";

import { WEBSITE_SCENE } from "./websiteSceneConfig";



/** Legacy fixed arc — used by unused marketing 3D helpers */

export function getWebsiteTowerYaw(

  scrollOffset: number,

  towerX: number = WEBSITE_SCENE.tower.offsetX,

  panelNormalYaw: number = WEBSITE_SCENE.tower.panelNormalYaw

): number {

  const sun = getWebsiteSunPosition(scrollOffset, towerX);

  const dx = sun.x - towerX;

  const dz = sun.z;

  return getTowerYawFromSolarAzimuthDegrees(

    solarAzimuthDegFromDirection(dx, dz),

    panelNormalYaw

  );

}



export function getWebsiteScrollSolar(

  scrollOffset: number,

  coords: HubSolarCoords | null,

  previewDate: Date | null

): WebsiteScrollSolarState {

  return getWebsiteScrollSolarState(scrollOffset, coords, previewDate);

}



export { getWebsiteSunPosition } from "./websiteDayCycle";

export type { WebsiteScrollSolarState } from "./websiteScrollSolar";


