import { useSyncExternalStore } from "react";
import {
  isTowerScenePrepared,
  subscribeTowerScenePrep,
} from "./towerScenePrep";

/** True once mesh merge finished for this model (see TowerScenePreloader). */
export function useTowerScenePrepared(cacheKey: string): boolean {
  return useSyncExternalStore(
    subscribeTowerScenePrep,
    () => isTowerScenePrepared(cacheKey),
    () => false
  );
}
