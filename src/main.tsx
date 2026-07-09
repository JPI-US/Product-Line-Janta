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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
