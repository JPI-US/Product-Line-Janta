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

export function CameraRig() {
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
    const splitShift = infoReveal * SCENE.camera.splitComposeShift;
    const { start, end, fovStart, fovEnd, splitPullback, splitFov } =
      SCENE.camera;

    camera.position.set(
      THREE.MathUtils.lerp(start.x, end.x, ease) -
        splitShift +
        infoReveal * splitPullback,
      THREE.MathUtils.lerp(start.y, end.y, ease),
      THREE.MathUtils.lerp(start.z, end.z, ease)
    );

    lookAt.set(
      THREE.MathUtils.lerp(SCENE.lookAt.x, SCENE.lookAtEnd.x, ease) -
        splitShift * 0.9,
      THREE.MathUtils.lerp(SCENE.lookAt.y, SCENE.lookAtEnd.y, ease),
      THREE.MathUtils.lerp(SCENE.lookAt.z, SCENE.lookAtEnd.z, ease)
    );
    camera.lookAt(lookAt);

    if ("fov" in camera) {
      const cam = camera as THREE.PerspectiveCamera;
      const animFov = THREE.MathUtils.lerp(fovStart, fovEnd, ease);
      const nextFov = THREE.MathUtils.lerp(animFov, splitFov, infoReveal);
      if (Math.abs(nextFov - lastFov.current) > 0.02) {
        cam.fov = nextFov;
        cam.updateProjectionMatrix();
        lastFov.current = nextFov;
      }
    }
  });

  return null;
}
