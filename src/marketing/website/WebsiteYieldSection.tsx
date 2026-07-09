import "../../styles/tower-3d.css";
import { ProductYieldSection } from "../../components/ProductYieldSection";

/** Home-page embed of the LFM "Fixed solar vs Janta" yield comparison table. */
export function WebsiteYieldSection() {
  return (
    <div className="web-home-yield">
      <ProductYieldSection productId="utility" scenario="500kw-dallas" />
    </div>
  );
}
