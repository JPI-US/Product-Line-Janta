import "../../styles/tower-3d.css";
import { ProductPowerProfileSection } from "../../components/ProductPowerProfileSection";
import { POWER_PROFILE_COPY } from "./websiteData";

/** Home-page embed of the daily output chart. */
export function WebsitePowerProfileSection() {
  return (
    <div className="web-home-chart">
      <ProductPowerProfileSection lede={POWER_PROFILE_COPY.lede} />
    </div>
  );
}
