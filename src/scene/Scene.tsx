import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { useEditorStore } from "../editor/store";
import { REGIONS } from "../data/regions";

export function Scene() {
  const region = useEditorStore((s) => s.region);
  const regionDef = REGIONS[region];
  const { x: sx, z: sz } = regionDef.size;

  return (
    <Canvas
      shadows
      camera={{ position: [sx * 0.6, 80, sz * 0.6], fov: 55 }}
      style={{ background: regionDef.sky }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[100, 200, 100]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Grid
        args={[sx, sz]}
        position={[0, 0.01, 0]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#3b3f49"
        sectionSize={16}
        sectionThickness={1}
        sectionColor="#5b6270"
        infiniteGrid={false}
        fadeDistance={Math.max(sx, sz) * 1.2}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[sx, sz]} />
        <meshStandardMaterial color={regionDef.ground} />
      </mesh>
      <OrbitControls
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={5}
        maxDistance={Math.max(sx, sz) * 1.5}
      />
    </Canvas>
  );
}
