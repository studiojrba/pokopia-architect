/**
 * A semi-transparent preview block that follows the cursor over the ground/blocks.
 * Position is driven by the parent Scene via a shared ref; rendering is inside R3F.
 */
import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { BLOCK_MAP } from "../data/blocks";
import { useEditorStore } from "../editor/store";

const GHOST_MAT = new THREE.MeshStandardMaterial({
  transparent: true,
  opacity: 0.45,
  depthWrite: false,
});

const BOX = new THREE.BoxGeometry(1.02, 1.02, 1.02); // slightly oversized to avoid z-fighting

export function GhostBlock({
  posRef,
}: {
  /** Mutable ref updated each pointer-move by the parent Scene. null = hidden. */
  posRef: React.MutableRefObject<THREE.Vector3 | null>;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const toolMode = useEditorStore((s) => s.toolMode);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const pos = posRef.current;
    if (!pos || toolMode === "pan") {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    mesh.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);

    const def = BLOCK_MAP.get(selectedBlockId);
    const color = def?.color ?? "#888888";
    if ((GHOST_MAT.color as THREE.Color).getHexString() !== color.replace("#", "")) {
      GHOST_MAT.color.set(color);
    }
    if (toolMode === "erase") {
      GHOST_MAT.color.set("#ff4444");
      GHOST_MAT.opacity = 0.5;
    } else {
      GHOST_MAT.opacity = 0.45;
    }
  });

  return <mesh ref={meshRef} geometry={BOX} material={GHOST_MAT} />;
}
