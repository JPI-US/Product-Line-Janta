import "../styles/tower-3d.css";
import { USE_UNIFIED_TOWER_CANVAS } from "../components/three/towerCanvasMode";
import { TowerPageWarmup } from "../components/three/TowerPageWarmup";
import Tower3DPageLegacy from "./Tower3DPageLegacy";
import Tower3DPageUnified from "./Tower3DPageUnified";

export default function Tower3DPage() {
  const Page = USE_UNIFIED_TOWER_CANVAS
    ? Tower3DPageUnified
    : Tower3DPageLegacy;

  return (
    <>
      <TowerPageWarmup />
      <Page />
    </>
  );
}
