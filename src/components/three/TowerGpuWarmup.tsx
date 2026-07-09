import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { markWebsiteHeroGpuReady } from "../../marketing/website/websiteHeroGpuReady";

type TowerGpuWarmupProps = {
  /** Wait until mesh prep finished — avoids compile + merge fighting on first scroll */
  ready?: boolean;
};

/** Compile shaders before first scroll frame (same visuals, less hitch). */
export function TowerGpuWarmup({ ready = true }: TowerGpuWarmupProps) {
  const { gl, scene, camera, invalidate } = useThree();

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    let raf = 0;

    const run = () => {
      if (cancelled) return;
      const finish = () => {
        if (cancelled) return;
        markWebsiteHeroGpuReady();
        invalidate();
        requestAnimationFrame(() => {
          if (!cancelled) invalidate();
        });
      };

      const compile = gl.compileAsync(scene, camera);
      const timeout = window.setTimeout(finish, 2500);
      void compile
        .then(() => {
          window.clearTimeout(timeout);
          finish();
        })
        .catch(() => {
          window.clearTimeout(timeout);
          finish();
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
