import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import {
  isWebsiteHeroRoute,
  kickWebsiteHeroBoot,
} from "./marketing/website/websiteHeroBoot";

if (isWebsiteHeroRoute()) {
  void kickWebsiteHeroBoot();
}

// A deploy can replace a lazy chunk's hashed filename while this tab still has
// the old build loaded — the next dynamic import 404s. Reload once (rather than
// showing the route error screen) so the tab picks up the new build's chunks.
window.addEventListener("vite:preloadError", () => {
  const key = "vite-preload-reload";
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
