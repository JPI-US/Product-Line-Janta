const HERO_GPU_READY = "website-hero-gpu-ready";

let gpuReady = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function markWebsiteHeroGpuReady() {
  if (gpuReady) return;
  gpuReady = true;
  notify();
  window.dispatchEvent(new Event(HERO_GPU_READY));
}

export function getWebsiteHeroGpuReady() {
  return gpuReady;
}

export function subscribeWebsiteHeroGpuReady(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
