import type { Hotspot } from "../TowerOrbitViewer";

/**
 * Spec hotspots for the 360° orbit viewer, one set per product. Positions are
 * in the viewer's normalized model space (tower scaled to ~3.5 units tall,
 * base at y=0). Waypoints fly the camera to the most flattering angle for
 * the part before the spec card opens.
 */
export const TOWER_HOTSPOTS: Record<string, Hotspot[]> = {
  designer: [
    {
      id: "dsr-array",
      label: "5.6 kW array",
      description:
        "Forty premium panels on a three-dimensional lattice — 5.6 kW rated output from a fraction of the ground footprint.",
      position: [0, 2.7, 0.35],
      waypoint: { label: "Array", azimuth: -0.35, polar: Math.PI * 0.38, radius: 6 },
    },
    {
      id: "dsr-cells",
      label: "Bifacial monocrystalline",
      description:
        "Bifacial monocrystalline cells harvest direct sun on the face and reflected light through the perforated backing sheet.",
      position: [0.9, 1.7, 0.4],
      waypoint: { label: "Cells", azimuth: 0.5, polar: Math.PI * 0.42, radius: 5 },
    },
    {
      id: "dsr-inverter",
      label: "MPPT inverter",
      description:
        "Maximum-power-point-tracking inverter at the base keeps every string at its optimum operating voltage through the day.",
      position: [0, 0.45, 0.3],
      waypoint: { label: "Inverter", azimuth: 0.15, polar: Math.PI * 0.55, radius: 5.5 },
    },
  ],
  utility: [
    {
      id: "lfm-head",
      label: "PV700 solar head",
      description:
        "High-density PV700 panel head — utility-scale capture engineered for megawatt fields on minimal land.",
      position: [0, 2.8, 0.3],
      waypoint: { label: "Head", azimuth: -0.3, polar: Math.PI * 0.36, radius: 6 },
    },
    {
      id: "lfm-tracker",
      label: "Dual-axis tracking",
      description:
        "Slew-drive tracking follows the sun through the full arc, keeping panels normal to the light from dawn to dusk.",
      position: [0.3, 1.6, 0.35],
      waypoint: { label: "Tracker", azimuth: 0.6, polar: Math.PI * 0.45, radius: 5.5 },
    },
    {
      id: "lfm-base",
      label: "Grid-tie base",
      description:
        "Galvanized steel mast and grid-tie electronics rated for 100+ mph wind loading and 25-year field life.",
      position: [0, 0.5, 0.25],
      waypoint: { label: "Base", azimuth: 0.1, polar: Math.PI * 0.56, radius: 6 },
    },
  ],
};
