let scrollRoot: HTMLElement | null = null;
const rootListeners = new Set<(root: HTMLElement | null) => void>();

export function setWebsiteScrollRoot(el: HTMLElement | null) {
  scrollRoot = el;
  rootListeners.forEach((listener) => listener(el));
}

export function getWebsiteScrollRoot() {
  return scrollRoot;
}

export function subscribeWebsiteScrollRoot(listener: (root: HTMLElement | null) => void) {
  rootListeners.add(listener);
  listener(scrollRoot);
  return () => {
    rootListeners.delete(listener);
  };
}
