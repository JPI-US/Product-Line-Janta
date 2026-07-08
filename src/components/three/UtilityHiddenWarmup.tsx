import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useTowerCanvasVisibility } from "./towerCanvasVisibility";
import { useTowerScenePrepared } from "./useTowerScenePrepared";
import { TOWER_PREP_KEYS } from "./towerScenePrep";

/**
 * One hidden-frame draw after utility prep so reveal at below-scroll 0.2 does not hitch.
 */
export function UtilityHiddenWarmup() {
  const { invalidate } = useThree();
  const { mountUtilityCanvas, renderUtility3d } = useTowerCanvasVisibility();
  const utilityReady = useTowerScenePrepared(TOWER_PREP_KEYS.utility);
  const didWarm = useRef(false);

  useEffect(() => {
    if (
      didWarm.current ||
      !utilityReady ||
      !mountUtilityCanvas ||
      renderUtility3d
    ) {
      return;
    }
    didWarm.current = true;
    invalidate();
  }, [utilityReady, mountUtilityCanvas, renderUtility3d, invalidate]);

  return null;
}
