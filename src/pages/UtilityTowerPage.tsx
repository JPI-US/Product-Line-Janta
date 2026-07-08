import "../styles/tower-3d.css";
import { ProductTowerPage } from "../components/ProductTowerPage";
import { TowerPageWarmup } from "../components/three/TowerPageWarmup";
import { WebsiteMarketingShell } from "../marketing/website/WebsiteMarketingShell";
import { useDocumentMeta } from "../lib/useDocumentMeta";

export default function UtilityTowerPage() {
  useDocumentMeta({
    title: "LFM Tower",
    description:
      "The LFM flagship 5.6 kW three-dimensional solar platform, built for scalable deployment and reliable yield.",
  });
  return (
    <WebsiteMarketingShell>
      <TowerPageWarmup productId="utility" />
      <ProductTowerPage productId="utility" />
    </WebsiteMarketingShell>
  );
}
