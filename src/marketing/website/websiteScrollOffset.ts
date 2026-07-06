import type { useScroll } from "@react-three/drei";
import { getImmediateScrollOffset } from "../../components/three/scrollOffset";
import { getWebsiteDrivenScrollOffset } from "./websiteScrollDriver";
import { getWebsiteScrollRoot } from "./websiteScrollRoot";

type ScrollState = ReturnType<typeof useScroll>;

let scrollOverride: number | null = null;

/** Bake route — pin scroll offset without a live scroll root */
export function setWebsiteScrollOffsetOverride(offset: number | null) {
  scrollOverride = offset;
}

/** Authoritative 0–1 scroll for website hero animation */
export function getWebsiteScrollOffset(scroll?: ScrollState): number {
  if (scrollOverride != null) return scrollOverride;

  const root = getWebsiteScrollRoot() ?? scroll?.el;
  if (root) {
    const max = root.scrollHeight - root.clientHeight;
    if (max > 0) return getImmediateScrollOffset(root);
  }

  if (scroll) return scroll.offset;
  return getWebsiteDrivenScrollOffset();
}
