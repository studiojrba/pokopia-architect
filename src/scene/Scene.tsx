import { useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { useEditorStore } from "../editor/store";
import { REGIONS, type RegionId } from "../data/regions";
import { VoxelGrid } from "./VoxelGrid";
import { GhostBlock } from "./GhostBlock";
import { useGroundTexture } from "./useGroundTexture";

// ---------------------------------------------------------------------------
// Ground plane — handles pointer events for placement on the base level
// ---------------------------------------------------------------------------

function Ground({
  sx,
  sz,
  ghostRef,
  onPlace,
}: {
  sx: number;
  sz: number;
  ghostRef: React.MutableRefObject<THREE.Vector3 | null>;
  onPlace: (x: number, y: number, z: number) => void;
}) {
  const toolMode = useEditorStore((s) => s.toolMode);

  const handlePointerMove = useCallback(
    (e: { point: THREE.Vector3; stopPropagation: () => void }) => {
      e.stopPropagation();
      if (toolMode === "pan") {
        ghostRef.current = null;
        return;
      }
      // Snap to grid — blocks sit at y=0, so ghost is at y=0
      ghostRef.current = new THREE.Vector3(
        Math.floor(e.point.x),
        0,
        Math.floor(e.point.z),
      );
    },
    [toolMode, ghostRef],
  );

  const handlePointerLeave = useCallback(() => {
    ghostRef.current = null;
  }, [ghostRef]);

  const handleClick = useCallback(
    (e: { point: THREE.Vector3; stopPropagation: () => void }) => {
      e.stopPropagation();
      if (toolMode !== "build") return;
      const x = Math.floor(e.point.x);
      const z = Math.floor(e.point.z);
      onPlace(x, 0, z);
    },
    [toolMode, onPlace],
  );

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      <planeGeometry args={[sx, sz]} />
      <meshStandardMaterial color="#3a3a3a" opacity={0} transparent />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Camera control switcher
// ---------------------------------------------------------------------------

function CameraRig({ sx, sz }: { sx: number; sz: number }) {
  const cameraMode = useEditorStore((s) => s.cameraMode);
  const toolMode = useEditorStore((s) => s.toolMode);
  const { camera } = useThree();

  return (
    <>
      {cameraMode === "orbit" && (
        <OrbitControls
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI / 2 - 0.04}
          minDistance={3}
          maxDistance={Math.max(sx, sz) * 1.5}
          // Disable orbit drag when in build/erase mode so clicks register on blocks
          enableRotate={toolMode === "pan"}
          enablePan={true}
          enableZoom={true}
          mouseButtons={{
            LEFT: toolMode === "pan" ? THREE.MOUSE.ROTATE : undefined,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />
      )}
      {cameraMode === "topDown" && (
        <OrbitControls
          target={[0, 0, 0]}
          enableRotate={false}
          enablePan={true}
          enableZoom={true}
          minDistance={10}
          maxDistance={Math.max(sx, sz) * 2}
          onStart={() => {
            // Lock camera to top-down angle
            camera.position.set(0, Math.max(sx, sz), 0);
            (camera as THREE.PerspectiveCamera).up.set(0, 0, -1);
          }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Scene interior (inside Canvas)
// ---------------------------------------------------------------------------

function SceneContent({
  region,
  sx,
  sz,
  ground,
  sky,
}: {
  region: RegionId;
  sx: number;
  sz: number;
  ground: string;
  sky: string;
}) {
  const ghostRef = useRef<THREE.Vector3 | null>(null);
  const placeBlock = useEditorStore((s) => s.placeBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const mapTexture = useGroundTexture(region);

  const handlePlace = useCallback(
    (x: number, y: number, z: number) => placeBlock(x, y, z),
    [placeBlock],
  );
  const handleRemove = useCallback(
    (x: number, y: number, z: number) => removeBlock(x, y, z),
    [removeBlock],
  );

  return (
    <>
      <color attach="background" args={[sky]} />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[sx * 0.5, 200, sz * 0.5]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-sz / 2}
        shadow-camera-right={sz / 2}
        shadow-camera-top={sx / 2}
        shadow-camera-bottom={-sx / 2}
      />

      {/* Ground — Serebii map texture or fallback colour */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[sx, sz]} />
        {mapTexture ? (
          <meshStandardMaterial map={mapTexture} roughness={0.9} metalness={0} />
        ) : (
          <meshStandardMaterial color={ground} />
        )}
      </mesh>

      {/* Subtle grid overlay so users can judge block positions */}
      <Grid
        args={[sx, sz]}
        position={[0, 0.01, 0]}
        cellSize={1}
        cellThickness={0.2}
        cellColor={mapTexture ? "#ffffff" : "#444"}
        cellOpacity={mapTexture ? 0.08 : 0.5}
        sectionSize={16}
        sectionThickness={0.6}
        sectionColor={mapTexture ? "#ffffff" : "#666"}
        sectionOpacity={mapTexture ? 0.18 : 0.7}
        infiniteGrid={false}
        fadeDistance={Math.max(sx, sz) * 1.4}
        fadeStrength={1.5}
      />

      {/* Invisible hit-plane for ground placement */}
      <Ground sx={sx} sz={sz} ghostRef={ghostRef} onPlace={handlePlace} />

      {/* Placed blocks */}
      <VoxelGrid onPlace={handlePlace} onRemove={handleRemove} />

      {/* Ghost / preview block */}
      <GhostBlock posRef={ghostRef} />

      {/* Camera controls */}
      <CameraRig sx={sx} sz={sz} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Canvas wrapper (exported)
// ---------------------------------------------------------------------------

export function Scene() {
  const region = useEditorStore((s) => s.region);
  const regionDef = REGIONS[region];
  const { x: sx, z: sz } = regionDef.size;

  // Isometric-ish starting view: high enough to see the full map,
  // angled so the terrain is visible as a 3D surface.
  const camH = Math.max(sx, sz) * 0.8;
  const camD = Math.max(sx, sz) * 0.55;

  return (
    <Canvas
      shadows
      camera={{ position: [0, camH, camD], fov: 50 }}
      gl={{ antialias: true }}
    >
      <SceneContent
        region={region}
        sx={sx}
        sz={sz}
        ground={regionDef.ground}
        sky={regionDef.sky}
      />
    </Canvas>
  );
}
