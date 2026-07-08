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
    value: "110",
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
    value: "Plug & play",
    title: "Backup power",
    detail: "Battery or generator compatible. Connect and go",
  },
  {
    id: "solar",
    value: "12 × 440 W",
    title: "Solar array",
    detail: "Buyer’s panel choice within ±2″ of standard height",
  },
];
