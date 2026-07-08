import { useScroll } from "@react-three/drei";
import { useEffect } from "react";
import { registerWebsiteDreiScroll } from "./websiteDreiScrollSync";

/**
 * Registers drei ScrollControls — DOM offset is synced via WebsitePageScrollCssSync.
 */
export function WebsiteScrollSync() {
  const scroll = useScroll();

  useEffect(() => {
    registerWebsiteDreiScroll(
      scroll as unknown as { scroll: { current: number } }
    );
    return () => registerWebsiteDreiScroll(null);
  }, [scroll]);

  return null;
}
