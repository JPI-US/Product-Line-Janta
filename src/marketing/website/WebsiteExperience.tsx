import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useWebsiteHeroCanvasActive } from "./useWebsiteHeroCanvasActive";
import { WEBSITE_HERO_NIGHT_CLEAR } from "./websiteHeroNightSky";
import { HUB_CANVAS_GL, TOWER_CANVAS_DPR, WebsiteScrollScene } from "./WebsiteScrollScene";

/**
 * Hero WebGL — continuous frameloop while the hero is on screen so scroll
 * damping, tower tracking, and day/night materials paint reliably in every
 * browser (demand + invalidate is brittle across engines).
 */
export function WebsiteExperience() {
  const heroCanvasActive = useWebsiteHeroCanvasActive();

  return (
    <Canvas
      className="web__canvas"
      frameloop={heroCanvasActive ? "always" : "never"}
      shadows
      dpr={TOWER_CANVAS_DPR}
      gl={HUB_CANVAS_GL}
      camera={{ near: 0.1, far: 80 }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(WEBSITE_HERO_NIGHT_CLEAR), 0);
      }}
    >
      <WebsiteScrollScene />
    </Canvas>
  );
}
