import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import {
  registerTowerCanvasInvalidate,
  unregisterTowerCanvasInvalidate,
} from "./towerCanvasInvalidate";

/** Registers the single canvas for both designer + utility invalidate calls */
export function UnifiedCanvasInvalidateBridge() {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    registerTowerCanvasInvalidate("designer", invalidate);
    registerTowerCanvasInvalidate("utility", invalidate);
    return () => {
      unregisterTowerCanvasInvalidate("designer");
      unregisterTowerCanvasInvalidate("utility");
    };
  }, [invalidate]);

  return null;
}
