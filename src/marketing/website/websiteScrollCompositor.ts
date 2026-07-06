const COMPOSITING_CLASS = "web-scroll-compositing";
const IDLE_MS = 140;

let idleTimer = 0;

/** Promote hero layers only while scroll transforms are actively changing. */
export function markWebsiteScrollCompositing() {
  document.documentElement.classList.add(COMPOSITING_CLASS);
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    document.documentElement.classList.remove(COMPOSITING_CLASS);
  }, IDLE_MS);
}

export function resetWebsiteScrollCompositing() {
  window.clearTimeout(idleTimer);
  idleTimer = 0;
  document.documentElement.classList.remove(COMPOSITING_CLASS);
}
