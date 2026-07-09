import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { SCENE } from "./sceneConfig";
import { ProceduralTowerEnvironment } from "./ProceduralTowerEnvironment";
import {
  applySharedEnvironmentToScene,
  captureSharedEnvironmentMap,
  getSharedEnvironmentMap,
} from "./towerEnvironmentCache";

function SharedEnvironmentApply() {
  const { scene } = useThree();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;

    if (applySharedEnvironmentToScene(scene)) {
      applied.current = true;
      return;
    }

    const id = window.setInterval(() => {
      if (scene.environment) {
        captureSharedEnvironmentMap(scene.environment);
        applied.current = true;
        window.clearInterval(id);
      }
    }, 40);

    return () => window.clearInterval(id);
  }, [scene]);

  return null;
}

type TowerSceneEnvironmentProps = {
  /** Override env strength (utility uses slightly stronger IBL instead of extra lights) */
  environmentIntensity?: number;
  /** HDRI resolution — product pages use a smaller map */
  environmentResolution?: number;
};

/** Identical image-based lighting — HDRI loads once, then reused across canvases */
export function TowerSceneEnvironment({
  environmentIntensity = SCENE.environment.intensity,
  environmentResolution = SCENE.environment.resolution,
}: TowerSceneEnvironmentProps) {
  const { rotationY } = SCENE.environment;
  const hasCachedEnv = getSharedEnvironmentMap() !== null;

  return (
    <>
      {!hasCachedEnv && (
        <ProceduralTowerEnvironment
          environmentIntensity={environmentIntensity}
          environmentResolution={environmentResolution}
          rotationY={rotationY}
        />
      )}
      <SharedEnvironmentApply />
    </>
  );
}
