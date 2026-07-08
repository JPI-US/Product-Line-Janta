import { useEffect } from "react";
import { kickWebsiteHeroBoot } from "./websiteHeroBoot";

/** Preload + prep the DSR designer tower before the hero canvas mounts */
export function WebsitePageWarmup() {
  useEffect(() => {
    void kickWebsiteHeroBoot();
  }, []);

  return null;
}
