import { useSyncExternalStore } from "react";
import { getBelowScrollProgress } from "./infoReveal";
import {
  subscribeTowerScrollOffset,
  towerScrollOffset,
} from "./towerScrollOffset";

export type ActiveTowerProduct = "designer" | "utility";

/** When the below-scroll section owns the viewport (utility tower visible) */
const UTILITY_ACTIVE_THRESHOLD = 0.06;

export function getActiveTowerProduct(
  scrollOffset = towerScrollOffset
): ActiveTowerProduct {
  return getBelowScrollProgress(scrollOffset) > UTILITY_ACTIVE_THRESHOLD
    ? "utility"
    : "designer";
}

export function useActiveTowerProduct(): ActiveTowerProduct {
  return useSyncExternalStore(
    subscribeTowerScrollOffset,
    () => getActiveTowerProduct(),
    () => "designer"
  );
}

export function isUtilityTowerActive(
  scrollOffset = towerScrollOffset
): boolean {
  return getActiveTowerProduct(scrollOffset) === "utility";
}
