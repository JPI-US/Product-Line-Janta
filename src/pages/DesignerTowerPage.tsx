import "../styles/tower-3d.css";
import { ProductTowerPage } from "../components/ProductTowerPage";
import { TowerPageWarmup } from "../components/three/TowerPageWarmup";
import { WebsiteMarketingShell } from "../marketing/website/WebsiteMarketingShell";
import { useDocumentMeta } from "../lib/useDocumentMeta";

export default function DesignerTowerPage() {
  useDocumentMeta({
    title: "DSR Tower",
    description:
      "The DSR commercial-scale three-dimensional solar tower with custom side panels and a scroll-driven 3D preview.",
  });
  return (
    <WebsiteMarketingShell>
      <TowerPageWarmup productId="designer" />
      <ProductTowerPage productId="designer" />
    </WebsiteMarketingShell>
  );
}
