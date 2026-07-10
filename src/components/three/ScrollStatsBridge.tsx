import { useScroll } from "@react-three/drei";
import { useEffect } from "react";
import { syncDesignerGalleryLayout } from "../ProductHorizontalGallery";
import { clearGalleryPinBand } from "./galleryScroll";
import { setTowerScrollRoot } from "./towerScrollRoot";

/** Registers scroll root for page-level CSS sync */
export function ScrollStatsBridge() {
  const scroll = useScroll();

  useEffect(() => {
    scroll.el.classList.add("tower-3d__scroll-root");
    document.documentElement.classList.add("tower-3d-scrolling");
    document.body.classList.add("tower-3d-scrolling");
    setTowerScrollRoot(scroll.el);

    const sync = () => syncDesignerGalleryLayout();
    sync();
    requestAnimationFrame(sync);
    const t = window.setTimeout(sync, 200);

    return () => {
      window.clearTimeout(t);
      document.documentElement.classList.remove("tower-3d-scrolling");
      document.documentElement.classList.remove("tower-3d-rotate-ready");
      document.documentElement.classList.remove("tower-3d-idle-hold");
      document.documentElement.classList.remove("tower-3d-designer-auto-scroll");
      document.body.classList.remove("tower-3d-scrolling");
      const page = document.querySelector<HTMLElement>(".tower-3d-page");
      if (page) {
        page.style.removeProperty("--tower-scroll");
        page.style.removeProperty("--info-reveal");
        page.style.removeProperty("--page-scroll");
        page.style.removeProperty("--below-scroll");
        page.style.removeProperty("--gallery-progress");
        page.style.removeProperty("--hero-fade");
        page.style.removeProperty("--idle-hint");
        page.style.removeProperty("--hero-hint-fade");
        clearGalleryPinBand(page);
      }
      setTowerScrollRoot(null);
    };
  }, [scroll.el]);

  return null;
}
