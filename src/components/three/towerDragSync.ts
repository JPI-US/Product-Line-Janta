import { towerDragState } from "./towerDragState";
import { utilityTowerDragState } from "./utilityTowerDragState";

export function isAnyTowerDragging(): boolean {
  return towerDragState.dragging || utilityTowerDragState.dragging;
}
