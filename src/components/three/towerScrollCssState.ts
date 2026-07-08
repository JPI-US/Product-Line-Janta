import { createScrollVarState, type ScrollVarState } from "./towerScrollCss";

let shared: ScrollVarState | null = null;

/** Single CSS var cache — one writer avoids damped/immediate compositor double-draw */
export function getSharedScrollVarState(): ScrollVarState {
  if (!shared) shared = createScrollVarState();
  return shared;
}
