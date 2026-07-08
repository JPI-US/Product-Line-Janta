import type { TowerProduct } from "./towers";
import { towers } from "./towers";

export type ProductId = "designer" | "utility";

export type ProductPageConfig = {
  id: ProductId;
  route: string;
  hubLabel: string;
  hubDescription: string;
  /** Short tags on the hub chooser card */
  hubChips: string[];
  tower: TowerProduct;
  /** Below the scroll hero — extra sections on this product's page only */
  belowVariant: "panels" | "specs";
};

const designerTower = towers.find((t) => t.id === "5kw")!;
const utilityTower = towers.find((t) => t.id === "10kw")!;

export const PRODUCT_PAGES: Record<ProductId, ProductPageConfig> = {
  designer: {
    id: "designer",
    route: "/products/designer",
    hubLabel: "DSR Tower",
    hubDescription:
      "Commercial-scale tower with custom side panels and scroll-driven 3D preview.",
    hubChips: ["5.4 kW", "Custom panels", "3D finishes"],
    tower: designerTower,
    belowVariant: "panels",
  },
  utility: {
    id: "utility",
    route: "/products/utility",
    hubLabel: "LFM Tower",
    hubDescription:
      "Flagship 5.6 kW platform built for scalable deployment and reliable yield.",
    hubChips: ["5.6 kW", "Azimuthal tracking", "Field-ready"],
    tower: utilityTower,
    belowVariant: "specs",
  },
};

export const PRODUCT_IDS = Object.keys(PRODUCT_PAGES) as ProductId[];

export function getProductPage(id: ProductId): ProductPageConfig {
  return PRODUCT_PAGES[id];
}
