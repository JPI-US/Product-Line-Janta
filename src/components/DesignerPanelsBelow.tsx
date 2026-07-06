import { useEffect } from "react";
import { DesignerPageCta } from "./DesignerPageCta";
import { DesignerPowerChartsSection } from "./DesignerPowerChartsSection";
import { DesignerTowerSpecs } from "./DesignerTowerSpecs";
import { PanelFinishesMarquee } from "./PanelFinishesMarquee";
import {
  ProductHorizontalGallery,
  syncDesignerGalleryLayout,
} from "./ProductHorizontalGallery";

/** Designer-only content below the scroll hero */
export function DesignerPanelsBelow() {
  useEffect(() => {
    syncDesignerGalleryLayout();
    const t = window.setTimeout(syncDesignerGalleryLayout, 400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="tower-3d__below-scroll">
      <section
        className="tower-3d__panels-section"
        aria-label="Side panel finishes"
      >
        <header className="tower-3d__panels-header">
          <div className="tower-3d__below-copy">
            <p className="tower-3d__below-eyebrow">Panel designs</p>
            <h2 className="tower-3d__below-title">Side panel finishes</h2>
          </div>
        </header>
        <PanelFinishesMarquee />
      </section>

      <DesignerTowerSpecs />

      <DesignerPowerChartsSection />

      <ProductHorizontalGallery />

      <DesignerPageCta />
    </div>
  );
}
