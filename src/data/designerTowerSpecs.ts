export type DesignerTowerSpec = {
  id: string;
  value: string;
  unit?: string;
  title: string;
  detail: string;
};

export const designerTowerSpecs: DesignerTowerSpec[] = [
  {
    id: "wind",
    value: "130",
    unit: "mph",
    title: "Wind rating",
    detail: "Rated for demanding coastal and open-field installs",
  },
  {
    id: "snow",
    value: "20",
    unit: "psf",
    title: "Snow load",
    detail: "Design snow load for year-round structural margin",
  },
  {
    id: "power",
    value: "Plug & Play",
    title: "4-Tier Resilience",
    detail: "Battery or generator compatible. Connect and go",
  },
  {
    id: "solar",
    value: "12 × 440 W",
    title: "Solar array",
    detail: "Buyer’s panel choice within ±2″ of standard height",
  },
  {
    id: "lifespan",
    value: "25",
    unit: "year",
    title: "Lifespan & warranty",
    detail: "25-year design life for real-world site deployments",
  },
];
