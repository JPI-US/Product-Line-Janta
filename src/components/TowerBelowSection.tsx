import { PanelFinishesMarquee } from "./PanelFinishesMarquee";
import { UtilityTowerSection } from "./UtilityTowerSection";

type TowerBelowSectionProps = {
  /** Transparent utility viewport; 3D renders in the shared canvas host */
  unifiedCanvas?: boolean;
};

export function TowerBelowSection({ unifiedCanvas = false }: TowerBelowSectionProps) {
  return (
    <div className="tower-3d__below-scroll">
      <section
        className="tower-3d__panels-section"
        aria-label="Side panel finishes"
      >
        <header className="tower-3d__panels-header">
          <div className="tower-3d__below-copy">
            <p className="tower-3d__below-eyebrow">Panel designs</p>
            <h2 className="tower-3d__below-title">Side panel finishes</h2>
          </div>
        </header>
        <PanelFinishesMarquee />
      </section>

      <UtilityTowerSection unifiedCanvas={unifiedCanvas} />
    </div>
  );
}
