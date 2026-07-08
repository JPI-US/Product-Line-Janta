import { useFrame, useThree } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { getInfoRevealProgress, getIntroScrollOffset } from "./infoReveal";
import { ANIMATION_SCROLL_END, SCENE } from "./sceneConfig";
import { isProductHero3dActive } from "./productScrollPerf";
import { SCROLL_OFFSET_EPS } from "./utilityCanvasPerf";

const lookAt = new THREE.Vector3();

function scrollEase(t: number): number {
  return 1 - Math.pow(1 - t, SCENE.scrollEase);
}


type CameraRigProps = {
  variant?: "designer" | "utility";
};

export function CameraRig({ variant = "utility" }: CameraRigProps = {}) {
  const scroll = useScroll();
  const { camera } = useThree();
  const lastFov = useRef(-1);
  const lastOffset = useRef(-1);

  useFrame(() => {
    if (!isProductHero3dActive(scroll.offset)) return;
    if (Math.abs(scroll.offset - lastOffset.current) < SCROLL_OFFSET_EPS) return;
    lastOffset.current = scroll.offset;

    const introOffset = getIntroScrollOffset(scroll.offset);
    const animT = Math.min(introOffset / ANIMATION_SCROLL_END, 1);
    const ease = scrollEase(animT);
    const infoReveal = getInfoRevealProgress(scroll.offset);
    const { start, end, fovStart, fovEnd, splitPullback, splitFov } =
      SCENE.camera;

    // Base intro pose — camera flies from start → end
    const baseX = THREE.MathUtils.lerp(start.x, end.x, ease);
    const baseY = THREE.MathUtils.lerp(start.y, end.y, ease);
    const baseZ = THREE.MathUtils.lerp(start.z, end.z, ease);
    const baseLookX = THREE.MathUtils.lerp(SCENE.lookAt.x, SCENE.lookAtEnd.x, ease);
    const baseLookY = THREE.MathUtils.lerp(SCENE.lookAt.y, SCENE.lookAtEnd.y, ease);
    const baseLookZ = THREE.MathUtils.lerp(SCENE.lookAt.z, SCENE.lookAtEnd.z, ease);

    let posX = baseX;
    let posY = baseY;
    let posZ = baseZ;
    let lookX = baseLookX;
    let lookY = baseLookY;
    let lookZ = baseLookZ;
    // Designer variant: hold the intro end pose and hand off to idle rotation.
    if (variant !== "designer") {
      // Utility — classic split-view horizontal pan + pullback
      const splitShift = infoReveal * SCENE.camera.splitComposeShift;
      posX = baseX - splitShift + infoReveal * splitPullback;
      lookX = baseLookX - splitShift * 0.9;
    }

    camera.position.set(posX, posY, posZ);
    lookAt.set(lookX, lookY, lookZ);
    camera.lookAt(lookAt);

    if ("fov" in camera) {
      const cam = camera as THREE.PerspectiveCamera;
      const animFov = THREE.MathUtils.lerp(fovStart, fovEnd, ease);
      const nextFov =
        variant === "designer"
          ? animFov
          : THREE.MathUtils.lerp(animFov, splitFov, infoReveal);
      if (Math.abs(nextFov - lastFov.current) > 0.02) {
        cam.fov = nextFov;
        cam.updateProjectionMatrix();
        lastFov.current = nextFov;
      }
    }
  });

  return null;
}
