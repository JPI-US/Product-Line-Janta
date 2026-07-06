import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { markWebsiteHeroGpuReady } from "../../marketing/website/websiteHeroGpuReady";

type TowerGpuWarmupProps = {
  /** Wait until mesh prep finished — avoids compile + merge fighting on first scroll */
  ready?: boolean;
};

/** Compile shaders before first scroll frame (same visuals, less hitch). */
export function TowerGpuWarmup({ ready = true }: TowerGpuWarmupProps) {
  const { gl, scene, camera, invalidate } = useThree();
  const warmed = useRef(false);

  useEffect(() => {
    if (!ready || warmed.current) return;
    warmed.current = true;

    let cancelled = false;
    let raf = 0;

    const run = () => {
      if (cancelled) return;
      void gl.compileAsync(scene, camera).then(() => {
        if (!cancelled) {
          markWebsiteHeroGpuReady();
          invalidate();
          requestAnimationFrame(() => {
            if (!cancelled) invalidate();
          });
        }
      });
    };

    raf = requestAnimationFrame(run);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [gl, scene, camera, invalidate, ready]);

  return null;
}
