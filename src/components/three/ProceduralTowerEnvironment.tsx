import { Environment, Lightformer } from "@react-three/drei";

type ProceduralTowerEnvironmentProps = {
  environmentIntensity?: number;
  environmentResolution?: number;
  rotationY?: number;
};

/** Local IBL from Lightformers — no external HDRI fetch (avoids GitHub 429s). */
export function ProceduralTowerEnvironment({
  environmentIntensity = 0.42,
  environmentResolution = 256,
  rotationY = -Math.PI * 0.5,
}: ProceduralTowerEnvironmentProps) {
  return (
    <Environment
      resolution={environmentResolution}
      environmentIntensity={environmentIntensity}
      environmentRotation={[0, rotationY, 0]}
      background={false}
    >
      <Lightformer
        form="rect"
        intensity={2.2}
        color="#f4f1ea"
        position={[6, 4.5, 2]}
        rotation-y={Math.PI / 2}
        scale={[14, 9, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1}
        color="#e6edf5"
        position={[-5, 2.5, -3]}
        scale={[11, 7, 1]}
      />
      <Lightformer
        form="ring"
        intensity={0.45}
        color="#fff8ef"
        position={[0, 7, 0]}
        scale={3.5}
      />
    </Environment>
  );
}
