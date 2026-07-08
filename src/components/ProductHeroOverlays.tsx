import { Link } from "react-router-dom";
import { getProductPage } from "../data/productPages";
import { DesignerConfigurator } from "./DesignerConfigurator";

/** Centered eyebrow + title — DSR and LFM share the same hero chrome */
export function ProductHeroOverlays({ productId }: { productId: "designer" | "utility" }) {
  const { tower: product } = getProductPage(productId);

  return (
    <div className="tower-3d__designer-hero-ui">
      <header
        className="tower-3d__designer-hero-centered"
        aria-label={`${product.title} hero`}
      >
        <p className="tower-3d__hero-eyebrow">Janta Power</p>
        <h1 className="tower-3d__hero-title">{product.title}</h1>
      </header>

      {/* Shared 3D controls — both DSR + LFM surface the 360 view + configurator */}
      <div className="tower-3d__hero-controls">
        <Link
          to={`/orbit/${productId}`}
          className="tower-3d__cta tower-3d__cta--ghost tower-3d__hero-controls__cta"
        >
          View in 360°
        </Link>
        <DesignerConfigurator />
      </div>
    </div>
  );
}
