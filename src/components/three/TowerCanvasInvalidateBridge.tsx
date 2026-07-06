import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import {
  registerTowerCanvasInvalidate,
  unregisterTowerCanvasInvalidate,
  type TowerCanvasSlot,
} from "./towerCanvasInvalidate";

/** Registers this canvas with the page-level idle driver */
export function TowerCanvasInvalidateBridge({ slot }: { slot: TowerCanvasSlot }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    registerTowerCanvasInvalidate(slot, invalidate);
    return () => unregisterTowerCanvasInvalidate(slot);
  }, [slot, invalidate]);

  return null;
}
