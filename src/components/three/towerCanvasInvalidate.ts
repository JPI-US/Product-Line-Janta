export type TowerCanvasSlot = "designer" | "utility";

const invalidators = new Map<TowerCanvasSlot, () => void>();

export function registerTowerCanvasInvalidate(
  slot: TowerCanvasSlot,
  invalidate: () => void
) {
  invalidators.set(slot, invalidate);
}

export function unregisterTowerCanvasInvalidate(slot: TowerCanvasSlot) {
  invalidators.delete(slot);
}

export function invalidateTowerCanvas(slot: TowerCanvasSlot) {
  invalidators.get(slot)?.();
}
