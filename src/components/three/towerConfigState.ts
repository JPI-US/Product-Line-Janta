/**
 * Designer-page configurator state (Stage 12). Module-level like the other
 * tower stores (towerDragState etc.) so the R3F scene reads it per frame
 * without React re-renders.
 */
export type TowerConfig = {
  /** Panel tint hex from a finish theme, or null for the stock PV glass */
  finishColor: string | null;
  /** Tower height scale, 1 = as modeled */
  height: number;
};

export const towerConfig: TowerConfig = {
  finishColor: null,
  height: 1,
};

const listeners = new Set<() => void>();

export function setTowerConfig(partial: Partial<TowerConfig>): void {
  Object.assign(towerConfig, partial);
  listeners.forEach((l) => l());
}

export function subscribeTowerConfig(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
