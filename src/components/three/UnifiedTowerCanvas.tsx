import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { PAGE_BG, SCENE, TOWER_CANVAS_GL } from "./sceneConfig";
import { UnifiedTowerScene } from "./UnifiedTowerScene";
import { useActiveTowerProduct } from "./useActiveTowerProduct";

export function UnifiedTowerCanvas() {
  const active = useActiveTowerProduct();
  const designerActive = active === "designer";
  const { start, fovStart } = SCENE.camera;

  return (
    <Canvas
      className="tower-3d__canvas tower-3d__unified-canvas"
      frameloop="always"
      shadows={designerActive}
      camera={{
        position: [start.x, start.y, start.z],
        fov: fovStart,
        near: 0.1,
        far: 200,
      }}
      gl={TOWER_CANVAS_GL}
      dpr={[1, 1.5]}
    >
      <color attach="background" args={[PAGE_BG]} />
      <Suspense
        fallback={
          <mesh>
            <boxGeometry args={[0.01, 0.01, 0.01]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        }
      >
        <UnifiedTowerScene />
      </Suspense>
    </Canvas>
  );
}
