import { getImmediateScrollOffset } from "../../components/three/scrollOffset";

type DreiScrollRef = {
  scroll: { current: number };
};

let scrollState: DreiScrollRef | null = null;

export function registerWebsiteDreiScroll(scroll: DreiScrollRef | null) {
  scrollState = scroll;
}

/** Keep drei ScrollControls offset aligned with the DOM root (called from scroll bus). */
export function syncWebsiteDreiScroll(root: HTMLElement) {
  if (!scrollState) return;
  const offset = getImmediateScrollOffset(root);
  scrollState.scroll.current = offset;
}
