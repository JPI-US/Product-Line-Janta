import { utilityDeploymentCopy } from "../data/utilityDeployment";

/** LFM — centered product description (deployment only; specs live below) */
export function UtilityDeploymentSection() {
  const { title, description } = utilityDeploymentCopy;

  return (
    <section
      className="tower-3d__deployment-section tower-3d__designer-band tower-3d__designer-band--canvas"
      aria-labelledby="utility-deployment-title"
    >
      <div className="tower-3d__deployment-inner">
        <h2 id="utility-deployment-title" className="tower-3d__below-title">
          {title}
        </h2>
        <p className="tower-3d__deployment-description">{description}</p>
      </div>
    </section>
  );
}
