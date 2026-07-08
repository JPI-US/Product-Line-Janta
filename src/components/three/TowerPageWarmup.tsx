import { useEffect } from "react";
import type { ProductId } from "../../data/productPages";
import { preloadTowerAssets } from "./towerAssetPreload";

type TowerPageWarmupProps = {
  /** When set, only preload this product (avoids loading the other tower on product routes) */
  productId?: ProductId;
};

/** Page-level warmup — runs before first scroll */
export function TowerPageWarmup({ productId }: TowerPageWarmupProps) {
  useEffect(() => {
    preloadTowerAssets(productId);
  }, [productId]);

  return null;
}
