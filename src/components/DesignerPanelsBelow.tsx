import { useEffect } from "react";
import { DesignerPageCta } from "./DesignerPageCta";
import { PanelFinishesMarquee } from "./PanelFinishesMarquee";
import {
  ProductHorizontalGallery,
  syncDesignerGalleryLayout,
} from "./ProductHorizontalGallery";
import { ProductTowerSpecs } from "./ProductTowerSpecs";
import { ProductYieldSection } from "./ProductYieldSection";
import { WebsiteFooter } from "../marketing/website/WebsiteFooter";

/** Designer-only content below the scroll hero */
export function DesignerPanelsBelow() {
  useEffect(() => {
    syncDesignerGalleryLayout();
    const t = window.setTimeout(syncDesignerGalleryLayout, 400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="tower-3d__below-scroll">
      <div className="tower-3d__below-soft-sky">
        <section
          className="tower-3d__panels-section tower-3d__designer-band tower-3d__designer-band--canvas"
          aria-label="Side panel finishes"
        >
          <header className="tower-3d__panels-header">
            <div className="tower-3d__below-copy">
              <h2 className="tower-3d__below-title">Side panel finishes</h2>
              <p className="tower-3d__below-lede">
                Wrap the tower to match the site — clean matte tones or bold
                branded panels, same hardware underneath.
              </p>
            </div>
          </header>
          <PanelFinishesMarquee />
        </section>

        <ProductYieldSection productId="designer" />

        <ProductTowerSpecs productId="designer" />

        <ProductHorizontalGallery productId="designer" />
      </div>

      <DesignerPageCta />

      <WebsiteFooter />
    </div>
  );
}
