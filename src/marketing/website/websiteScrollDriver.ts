import { getImmediateScrollOffset } from "../../components/three/scrollOffset";
import { WEBSITE_SCROLL_PAGES } from "./websiteScrollConfig";
import { getWebsiteScrollRoot } from "./websiteScrollRoot";

let virtualScrollPx = 0;
let targetScrollPx = 0;
let storedOffset = 0;
let running = false;
let rafId = 0;
let lastTickMs = 0;

/** Frame-rate independent ease — higher = snappier, lower = floatier */
const SMOOTH_LAMBDA = 22;
const SNAP_EPS = 0.4;
const SCROLL_EVENT_EPS = 0.00035;

let lastScrollEventOffset = -1;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getScrollSpan(root: HTMLElement | null) {
  const page = root?.clientHeight || window.innerHeight;
  return Math.max(page * (WEBSITE_SCROLL_PAGES - 1), 1);
}

function getScrollLimit(root: HTMLElement) {
  const domMax = root.scrollHeight - root.clientHeight;
  return domMax > 0 ? domMax : getScrollSpan(root);
}

function readScrollPx(root: HTMLElement) {
  const domMax = root.scrollHeight - root.clientHeight;
  return domMax > 0 ? root.scrollTop : virtualScrollPx;
}

function writeScrollPx(root: HTMLElement, px: number, limit: number) {
  const clamped = Math.max(0, Math.min(limit, px));
  const domMax = root.scrollHeight - root.clientHeight;
  if (domMax > 0) root.scrollTop = clamped;
  virtualScrollPx = clamped;
  return clamped;
}

function dispatchScroll(root: HTMLElement, force = false) {
  if (!force && Math.abs(storedOffset - lastScrollEventOffset) < SCROLL_EVENT_EPS) return;
  lastScrollEventOffset = storedOffset;
  root.dispatchEvent(new Event("scroll"));
}

function storeOffset(offset: number) {
  storedOffset = Math.min(1, Math.max(0, offset));
  return storedOffset;
}

function scheduleTick() {
  if (rafId) return;
  rafId = requestAnimationFrame(onTick);
}

function onTick(now: number) {
  rafId = 0;
  const root = getWebsiteScrollRoot();
  if (!root || !running) return;

  const dt = lastTickMs ? Math.min(64, now - lastTickMs) : 16;
  lastTickMs = now;

  const limit = getScrollLimit(root);
  const current = readScrollPx(root);
  let next = targetScrollPx;

  if (!prefersReducedMotion()) {
    const alpha = 1 - Math.exp((-SMOOTH_LAMBDA * dt) / 1000);
    next = current + (targetScrollPx - current) * alpha;
  }

  const applied = writeScrollPx(root, next, limit);
  storeOffset(applied / limit);
  dispatchScroll(root);

  if (!prefersReducedMotion() && Math.abs(targetScrollPx - applied) > SNAP_EPS) {
    scheduleTick();
    return;
  }

  targetScrollPx = applied;
}

/** Begin smooth-scroll loop after the drei scroll root is registered */
export function startWebsiteSmoothScroll() {
  running = true;
  lastTickMs = 0;
  const root = getWebsiteScrollRoot();
  if (root) {
    const px = readScrollPx(root);
    targetScrollPx = px;
    virtualScrollPx = px;
  }
}

/** Tear down RAF when leaving the marketing page */
export function stopWebsiteSmoothScroll() {
  running = false;
  lastTickMs = 0;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

/** Reset wheel-driven scroll when leaving the page */
export function resetWebsiteScrollDriver() {
  stopWebsiteSmoothScroll();
  virtualScrollPx = 0;
  targetScrollPx = 0;
  storedOffset = 0;
  lastScrollEventOffset = -1;
}

/** Authoritative 0–1 scroll — DOM when scrollable, virtual pixels otherwise */
export function getWebsiteDrivenScrollOffset(): number {
  const root = getWebsiteScrollRoot();
  if (root) {
    const max = root.scrollHeight - root.clientHeight;
    if (max > 0) {
      return storeOffset(getImmediateScrollOffset(root));
    }
  }

  const span = getScrollSpan(root);
  return storeOffset(virtualScrollPx / span);
}

export function getWebsiteStoredScrollOffset() {
  return storedOffset;
}

/** Keep driver cache aligned when scrollTop is set directly on the root */
export function syncWebsiteStoredScrollFromDom() {
  const root = getWebsiteScrollRoot();
  if (!root) return storedOffset;

  const max = root.scrollHeight - root.clientHeight;
  if (max <= 0) return storedOffset;

  const px = root.scrollTop;
  targetScrollPx = px;
  virtualScrollPx = px;
  return storeOffset(px / max);
}

/** Pin normalized scroll after layout remeasure — keeps below-content translate stable */
export function setWebsiteDrivenScrollOffset(offset: number): number {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  lastTickMs = 0;

  const normalized = Math.min(1, Math.max(0, offset));
  const root = getWebsiteScrollRoot();

  if (!root) {
    const span = getScrollSpan(root);
    const px = normalized * span;
    targetScrollPx = px;
    virtualScrollPx = px;
    return storeOffset(normalized);
  }

  const limit = getScrollLimit(root);
  const px = normalized * limit;
  targetScrollPx = px;
  virtualScrollPx = px;
  writeScrollPx(root, px, limit);
  storeOffset(normalized);
  dispatchScroll(root, true);
  return normalized;
}

/** Queue wheel / touch delta and return normalized offset */
export function applyWebsiteWheelDelta(deltaY: number): number {
  const root = getWebsiteScrollRoot();
  if (!root) return getWebsiteDrivenScrollOffset();

  const limit = getScrollLimit(root);
  const current = readScrollPx(root);

  if (!rafId && Math.abs(targetScrollPx - current) > SNAP_EPS) {
    targetScrollPx = current;
  }

  targetScrollPx = Math.max(0, Math.min(limit, targetScrollPx + deltaY));

  if (prefersReducedMotion()) {
    const applied = writeScrollPx(root, targetScrollPx, limit);
    targetScrollPx = applied;
    storeOffset(applied / limit);
    dispatchScroll(root);
    return storedOffset;
  }

  scheduleTick();
  return storeOffset(readScrollPx(root) / limit);
}
