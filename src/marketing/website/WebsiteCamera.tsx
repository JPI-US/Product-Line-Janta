import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import * as THREE from "three";
import { WEBSITE_SCENE } from "./websiteSceneConfig";

const lookAt = new THREE.Vector3();

export function WebsiteCamera() {
  const { camera } = useThree();
  const { position, fov, lookAt: target } = WEBSITE_SCENE.camera;

  useLayoutEffect(() => {
    camera.position.set(position.x, position.y, position.z);
    lookAt.set(target.x, target.y, target.z);
    camera.lookAt(lookAt);

    if ("fov" in camera) {
      const cam = camera as THREE.PerspectiveCamera;
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  }, [camera, fov, position.x, position.y, position.z, target.x, target.y, target.z]);

  return null;
}
