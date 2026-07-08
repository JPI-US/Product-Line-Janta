import "../styles/tower-3d.css";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { TowerOrbitViewer } from "../components/TowerOrbitViewer";
import { TOWER_HOTSPOTS } from "../components/three/towerHotspots";
import {
  DESIGNER_MODEL_URL,
  UTILITY_MODEL_URL,
} from "../components/three/towerModelUrls";

const MODELS: Record<string, { url: string; title: string; back: string }> = {
  designer: {
    url: DESIGNER_MODEL_URL,
    title: "DSR Tower — 360° view",
    back: "/products/designer",
  },
  utility: {
    url: UTILITY_MODEL_URL,
    title: "LFM Tower — 360° view",
    back: "/products/utility",
  },
};

const WAYPOINTS = [
  { label: "Front", azimuth: 0, polar: Math.PI * 0.42, radius: 7 },
  { label: "Side", azimuth: Math.PI * 0.5, polar: Math.PI * 0.42, radius: 7 },
  { label: "Back", azimuth: Math.PI, polar: Math.PI * 0.42, radius: 7 },
  { label: "Top", azimuth: Math.PI * 0.25, polar: Math.PI * 0.22, radius: 8 },
];

export default function TowerOrbitPage() {
  const params = useParams<{ productId: string }>();
  const productId = params.productId ?? "designer";
  const config = MODELS[productId] ?? MODELS.designer;

  useEffect(() => {
    document.title = `${config.title} · Janta Power`;
  }, [config.title]);

  return (
    <main
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#0f141a",
        color: "#fff",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem clamp(1rem, 4vw, 2.5rem)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h1
          style={{
            fontSize: "1.05rem",
            fontWeight: 600,
            letterSpacing: "0.01em",
            margin: 0,
          }}
        >
          {config.title}
        </h1>
        <Link
          to={config.back}
          style={{
            color: "#ffbf14",
            textDecoration: "none",
            fontSize: "0.92rem",
            fontWeight: 500,
          }}
        >
          ← Back to product
        </Link>
      </header>
      <div style={{ flex: 1, minHeight: 0, background: "#f5f5f7" }}>
        <TowerOrbitViewer
          modelUrl={config.url}
          waypoints={WAYPOINTS}
          hotspots={TOWER_HOTSPOTS[productId] ?? TOWER_HOTSPOTS.designer}
        />
      </div>
    </main>
  );
}
