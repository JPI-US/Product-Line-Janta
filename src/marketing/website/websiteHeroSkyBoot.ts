const HERO_SKY_PAINTED = "website-hero-sky-painted";

let skyPainted = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

/** First living-sky paint finished — safe to drop inline boot background */
export function markWebsiteHeroSkyPainted() {
  if (skyPainted) return;
  skyPainted = true;
  notify();
  window.dispatchEvent(new Event(HERO_SKY_PAINTED));
}

export function isWebsiteHeroSkyPainted() {
  return skyPainted;
}

export function subscribeWebsiteHeroSkyPainted(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
