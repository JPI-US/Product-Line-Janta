import { createWebScrollVarState, type WebScrollVarState } from "./websiteScrollCss";

let shared: WebScrollVarState | null = null;

/** Single CSS var cache — one writer avoids duplicate compositor updates */
export function getWebsiteScrollVarState(): WebScrollVarState {
  if (!shared) shared = createWebScrollVarState();
  return shared;
}
