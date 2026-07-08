import { WebsiteDashboardScaleFit } from "./WebsiteDashboardScaleFit";
import { WebsiteJantaOsDashboard } from "./WebsiteJantaOsDashboard";

type Props = {
  /** Keeps live data polling while the section is near the viewport. */
  active: boolean;
  /** Triggers gauge/chart enter animations when the tablet is fully in view. */
  animate: boolean;
};

/** Marketing tablet embed — Portal Marketing system with scale-to-fit frame. */
export function WebsiteJantaOsDashboardEmbed({ active, animate }: Props) {
  return (
    <WebsiteDashboardScaleFit>
      <WebsiteJantaOsDashboard active={active} animate={animate} />
    </WebsiteDashboardScaleFit>
  );
}
