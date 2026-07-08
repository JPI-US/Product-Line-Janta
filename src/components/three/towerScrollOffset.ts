/** Normalized 0–1 scroll offset from drei's scroll root (updated outside WebGL when needed) */
export let towerScrollOffset = 0;

const listeners = new Set<() => void>();

export function subscribeTowerScrollOffset(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setTowerScrollOffset(offset: number) {
  towerScrollOffset = offset;
  listeners.forEach((listener) => listener());
}
