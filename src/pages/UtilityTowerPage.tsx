import "../styles/tower-3d.css";
import { ProductTowerPage } from "../components/ProductTowerPage";
import { TowerPageWarmup } from "../components/three/TowerPageWarmup";
import { WebsiteMarketingShell } from "../marketing/website/WebsiteMarketingShell";

export default function UtilityTowerPage() {
  return (
    <WebsiteMarketingShell>
      <TowerPageWarmup productId="utility" />
      <ProductTowerPage productId="utility" />
    </WebsiteMarketingShell>
  );
}
