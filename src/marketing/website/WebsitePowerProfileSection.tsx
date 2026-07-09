import "../../styles/tower-3d.css";
import { ProductPowerProfileSection } from "../../components/ProductPowerProfileSection";

/** Home-page embed of the LFM "Output across the day" chart. */
export function WebsitePowerProfileSection() {
  return (
    <div className="web-home-chart">
      <ProductPowerProfileSection lede="Single 5.6 kW tower. Tracking holds output from morning to evening, instead of a single midday peak." />
    </div>
  );
}
