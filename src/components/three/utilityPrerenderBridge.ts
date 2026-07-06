/** Shared state between UtilityDragSurface and UtilityTowerPrerender */

let displayedFrameIndex = 0;
const paintListeners = new Set<() => void>();

export function getUtilityPrerenderDisplayedIndex(): number {
  return displayedFrameIndex;
}

export function setUtilityPrerenderDisplayedIndex(index: number): void {
  displayedFrameIndex = index;
}

export function subscribeUtilityPrerenderPaint(listener: () => void): () => void {
  paintListeners.add(listener);
  return () => paintListeners.delete(listener);
}

/** Immediate frame paint (e.g. on pointermove while dragging) */
export function requestUtilityPrerenderPaint(): void {
  paintListeners.forEach((listener) => listener());
}
