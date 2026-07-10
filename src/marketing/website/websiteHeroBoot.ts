let kicked = false;

/** Start tower fetch + mesh prep as early as possible (before React lazy chunks).
 *
 * The tower/three modules are imported dynamically (not at the top of this file)
 * on purpose: `main.tsx` imports this module eagerly, so a static `import` here
 * would pull the ~1.25 MB three.js bundle into the entry graph — Vite would then
 * emit a `<link rel="modulepreload">` for it and every device (phones included)
 * would download it before any runtime check could run. Keeping them dynamic
 * means three.js stays out of the initial load until this actually runs. */
export function kickWebsiteHeroBoot(): Promise<void> {
  // Phones render the static hero poster and never mount the live 3D tower, so
  // skip warming three.js entirely. Must match the hero's `useIsMobile`
  // breakpoint in sections.tsx.
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 820px)").matches
  ) {
    return Promise.resolve();
  }
  if (!kicked) {
    kicked = true;
    void import("../../components/three/towerAssetPreload").then((m) =>
      m.preloadTowerAssets("designer"),
    );
  }
  return import("./websiteTowerWarmup").then((m) => m.warmupHeroTowerScene());
}

export function isWebsiteHeroRoute(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return path === "/" || path === "/website";
}
