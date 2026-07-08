import { useSyncExternalStore } from "react";
import {
  getWebsiteHeroCanvasActive,
  subscribeWebsiteHeroCanvasActive,
} from "./websiteHeroCanvasGate";

export function useWebsiteHeroCanvasActive() {
  return useSyncExternalStore(
    subscribeWebsiteHeroCanvasActive,
    getWebsiteHeroCanvasActive,
    () => true,
  );
}
