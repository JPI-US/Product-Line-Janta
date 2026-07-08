import { getProductPage } from "../data/productPages";
import { ProductGallerySection } from "./ProductGallerySection";

/** Utility-only copy below the scroll hero */
export function UtilityProductBelow() {
  const { tower } = getProductPage("utility");

  return (
    <div className="tower-3d__below-scroll">
      <section
        className="tower-3d__utility-below-copy"
        aria-label="LFM Tower details"
      >
        <header className="tower-3d__panels-header">
          <div className="tower-3d__below-copy">
            <p className="tower-3d__below-eyebrow">Deployment</p>
            <h2 className="tower-3d__below-title">Built for the field</h2>
            <p className="tower-3d__utility-below-desc">{tower.description}</p>
          </div>
        </header>
        <ul className="tower-3d__utility-below-bullets">
          {tower.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <ProductGallerySection />
    </div>
  );
}
