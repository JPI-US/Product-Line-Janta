import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Kick the hero tower warmup as early as possible, but through a dynamic
// import — a static one would drag three-vendor into the entry chunk and
// block first paint behind ~240 KB gz of 3D runtime.
const path = window.location.pathname;
if (path === "/" || path === "/website") {
  void import("./marketing/website/websiteHeroBoot").then((m) =>
    m.kickWebsiteHeroBoot(),
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
