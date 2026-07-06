import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WEBSITE_PAGE_BG } from "./websiteData";

const SKY_RADIUS = 480;
const pageBg = new THREE.Color(WEBSITE_PAGE_BG);

/** Fixed page-tone sky — matches --web-page off-white */
export function WebsiteSky() {
  const { gl } = useThree();

  useFrame(() => {
    gl.setClearColor(pageBg, 1);
  }, -1);

  return (
    <mesh frustumCulled={false} renderOrder={-1000}>
      <sphereGeometry args={[SKY_RADIUS, 48, 32]} />
      <meshBasicMaterial
        color={WEBSITE_PAGE_BG}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  );
}
