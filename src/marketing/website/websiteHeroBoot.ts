import { preloadTowerAssets } from "../../components/three/towerAssetPreload";
import { warmupHeroTowerScene } from "./websiteTowerWarmup";

let kicked = false;

/** Start tower fetch + mesh prep as early as possible (before React lazy chunks). */
export function kickWebsiteHeroBoot(): Promise<void> {
  if (!kicked) {
    kicked = true;
    preloadTowerAssets("designer");
  }
  return warmupHeroTowerScene();
}

export function isWebsiteHeroRoute(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return path === "/" || path === "/website";
}
