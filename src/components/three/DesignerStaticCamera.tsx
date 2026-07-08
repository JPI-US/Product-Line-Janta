import { useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect } from "react";
import * as THREE from "three";
import { getSplitViewCamera } from "./sceneConfig";
import { SCENE } from "./sceneConfig";

const lookAt = new THREE.Vector3();

export function DesignerStaticCamera() {
  const { camera, size } = useThree();
  const towerX = SCENE.tower.offsetX;

  const applyCamera = () => {
    const { position, lookAt: target, fov } = getSplitViewCamera(towerX);
    camera.position.set(...position);
    lookAt.set(...target);
    camera.lookAt(lookAt);
    if ("fov" in camera) {
      const cam = camera as THREE.PerspectiveCamera;
      cam.fov = fov;
      cam.aspect = size.width / Math.max(size.height, 1);
      cam.updateProjectionMatrix();
    }
  };

  useLayoutEffect(() => {
    applyCamera();
  });

  useEffect(() => {
    applyCamera();
  }, [camera, size.width, size.height, towerX]);

  return null;
}
