import { useFrame, useThree } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { getInfoRevealProgress, getIntroScrollOffset } from "./infoReveal";
import { isProductHeroLayout } from "../../lib/productHeroScroll";
import { ANIMATION_SCROLL_END, DESIGNER_CAMERA_FRAMING, SCENE } from "./sceneConfig";
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

    const productHero = isProductHeroLayout(variant);
    const introOffset = getIntroScrollOffset(scroll.offset, productHero);
    const animT = Math.min(introOffset / ANIMATION_SCROLL_END, 1);
    const ease = scrollEase(animT);
    const infoReveal = getInfoRevealProgress(scroll.offset, productHero);
    const { start, end, fovStart, fovEnd, splitPullback, splitFov } =
      SCENE.camera;
    const camFraming = productHero ? DESIGNER_CAMERA_FRAMING : null;

    // Base intro pose — camera flies from start → end
    const baseX = THREE.MathUtils.lerp(start.x, end.x, ease);
    const baseY = THREE.MathUtils.lerp(
      start.y + (camFraming?.startYOffset ?? 0),
      end.y + (camFraming?.endYOffset ?? 0),
      ease
    );
    const baseZ = THREE.MathUtils.lerp(start.z, end.z, ease);
    const baseLookX = THREE.MathUtils.lerp(SCENE.lookAt.x, SCENE.lookAtEnd.x, ease);
    const baseLookY = THREE.MathUtils.lerp(
      SCENE.lookAt.y + (camFraming?.lookAtStartYOffset ?? 0),
      SCENE.lookAtEnd.y + (camFraming?.lookAtEndYOffset ?? 0),
      ease
    );
    const baseLookZ = THREE.MathUtils.lerp(SCENE.lookAt.z, SCENE.lookAtEnd.z, ease);

    let posX = baseX;
    let posY = baseY;
    let posZ = baseZ;
    let lookX = baseLookX;
    let lookY = baseLookY;
    let lookZ = baseLookZ;
    // Product hero: hold the intro end pose and hand off to idle rotation.
    if (!productHero) {
      // Legacy split-view horizontal pan + pullback
      const splitShift = infoReveal * SCENE.camera.splitComposeShift;
      posX = baseX - splitShift + infoReveal * splitPullback;
      lookX = baseLookX - splitShift * 0.9;
    } else if (camFraming && "endPullBack" in camFraming && ease > 0) {
      const pullBack = camFraming.endPullBack * ease;
      const dx = posX - lookX;
      const dy = posY - lookY;
      const dz = posZ - lookZ;
      const dist = Math.hypot(dx, dy, dz) || 1;
      const scale = (dist + pullBack) / dist;
      posX = lookX + dx * scale;
      posY = lookY + dy * scale;
      posZ = lookZ + dz * scale;
    }

    camera.position.set(posX, posY, posZ);
    lookAt.set(lookX, lookY, lookZ);
    camera.lookAt(lookAt);

    if ("fov" in camera) {
      const cam = camera as THREE.PerspectiveCamera;
      const fovFrom = productHero && camFraming && "fovStart" in camFraming
        ? camFraming.fovStart
        : fovStart;
      const fovTo = productHero && camFraming && "fovEnd" in camFraming
        ? camFraming.fovEnd
        : fovEnd;
      const animFov = THREE.MathUtils.lerp(fovFrom, fovTo, ease);
      const nextFov =
        productHero
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
