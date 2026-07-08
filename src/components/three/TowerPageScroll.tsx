import { useEffect } from "react";
import { handleDesignerGalleryWheel } from "./designerGalleryScrub";
import { getTowerScrollRoot } from "./towerScrollRoot";
import { towerDragState } from "./towerDragState";

/** Forward wheel anywhere on the page to drei's scroll root (single scroll driver). */
export function TowerPageScroll() {
  useEffect(() => {
    const page = document.querySelector(".tower-3d-page");
    if (!page) return;

    const onWheel = (event: Event) => {
      if (!(event instanceof WheelEvent)) return;
      if (towerDragState.dragging) return;

      const scrollRoot = getTowerScrollRoot();
      if (!scrollRoot) return;

      if (handleDesignerGalleryWheel(event, scrollRoot)) return;

      scrollRoot.scrollTop += event.deltaY;
      event.preventDefault();
    };

    page.addEventListener("wheel", onWheel, { passive: false });
    return () => page.removeEventListener("wheel", onWheel);
  }, []);

  return null;
}
