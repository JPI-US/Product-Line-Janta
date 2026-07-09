import type { DesignerTowerSpec } from "./designerTowerSpecs";

export const utilityTowerSpecs: DesignerTowerSpec[] = [
  {
    id: "wind",
    value: "130",
    unit: "mph",
    title: "Wind rating",
    detail: "Rated for demanding coastal and open-field installs",
  },
  {
    id: "snow",
    value: "60–80",
    unit: "psf",
    title: "Snow load",
    detail: "Design snow load for year-round structural margin",
  },
  {
    id: "solar",
    value: "620–750",
    unit: "watt",
    title: "Bifacial panels",
    detail: "Bifacial cells capture direct sun and reflected light for higher yield per tower.",
  },
  {
    id: "lifespan",
    value: "25+",
    unit: "year",
    title: "System lifespan",
    detail: "25+ year design life for real-world site deployments",
  },
];
