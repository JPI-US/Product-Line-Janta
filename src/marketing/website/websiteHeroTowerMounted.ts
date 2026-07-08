let meshMounted = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

/** Hero tower clone is in the WebGL scene — safe to end boot invalidation */
export function markWebsiteHeroTowerMeshMounted() {
  if (meshMounted) return;
  meshMounted = true;
  notify();
  window.dispatchEvent(new Event("hub-tower-invalidate"));
}

export function resetWebsiteHeroTowerMeshMounted() {
  if (!meshMounted) return;
  meshMounted = false;
  notify();
}

export function isWebsiteHeroTowerMeshMounted() {
  return meshMounted;
}

export function subscribeWebsiteHeroTowerMeshMounted(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
