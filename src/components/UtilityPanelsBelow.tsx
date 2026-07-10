import { useEffect } from "react";
import { ProductHorizontalGallery, syncDesignerGalleryLayout } from "./ProductHorizontalGallery";
import { ProductPageCta } from "./ProductPageCta";
import { ProductPowerProfileSection } from "./ProductPowerProfileSection";
import { ProductTowerSpecs } from "./ProductTowerSpecs";
import { ProductYieldSection } from "./ProductYieldSection";
import { UtilityDeploymentSection } from "./UtilityDeploymentSection";
import { WebsiteFooter } from "../marketing/website/WebsiteFooter";

/** LFM — same scroll bands as DSR, with deployment instead of custom panels */
export function UtilityPanelsBelow() {
  useEffect(() => {
    syncDesignerGalleryLayout();
    const t = window.setTimeout(syncDesignerGalleryLayout, 400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="tower-3d__below-scroll">
      <div className="tower-3d__below-soft-sky">
        <UtilityDeploymentSection />

        <ProductYieldSection productId="utility" />

        <ProductPowerProfileSection />

        <ProductTowerSpecs productId="utility" />

        <ProductHorizontalGallery productId="utility" />
      </div>

      <ProductPageCta productId="utility" />

      <WebsiteFooter />
    </div>
  );
}
