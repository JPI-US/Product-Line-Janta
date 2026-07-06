/** drei ScrollControls root element — set by ScrollStatsBridge */
let scrollRoot: HTMLElement | null = null;

export function getTowerScrollRoot(): HTMLElement | null {
  return scrollRoot;
}

export function setTowerScrollRoot(el: HTMLElement | null): void {
  scrollRoot = el;
}
