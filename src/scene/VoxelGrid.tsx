/**
 * Renders all placed blocks in the editor store as individual colored meshes.
 * Simple per-block approach — fast enough for typical Pokopia builds (<2000 blocks).
 */
import { useMemo } from "react";
import * as THREE from "three";
import { useEditorStore } from "../editor/store";
import { BLOCK_MAP } from "../data/blocks";

const BOX = new THREE.BoxGeometry(1, 1, 1);

// Cache materials by color+emissive pair to avoid per-frame allocations
const matCache = new Map<string, THREE.MeshStandardMaterial>();
function getMaterial(color: string, emissive?: string): THREE.MeshStandardMaterial {
  const key = color + (emissive ?? "");
  let mat = matCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color,
      emissive: emissive ?? "#000000",
      emissiveIntensity: emissive ? 0.4 : 0,
      roughness: 0.8,
      metalness: 0.1,
    });
    matCache.set(key, mat);
  }
  return mat;
}

/** Single voxel mesh — memoized so stable block entries don't re-mount. */
function VoxelMesh({
  x,
  y,
  z,
  blockId,
  onLeftClick,
  onRightClick,
}: {
  x: number;
  y: number;
  z: number;
  blockId: string;
  onLeftClick: (x: number, y: number, z: number, nx: number, ny: number, nz: number) => void;
  onRightClick: (x: number, y: number, z: number) => void;
}) {
  const def = BLOCK_MAP.get(blockId);
  const mat = useMemo(
    () => getMaterial(def?.color ?? "#888888", def?.emissive),
    [def?.color, def?.emissive],
  );

  return (
    <mesh
      geometry={BOX}
      material={mat}
      position={[x + 0.5, y + 0.5, z + 0.5]}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        if (!e.face) return;
        const n = e.face.normal;
        onLeftClick(x, y, z, Math.round(n.x), Math.round(n.y), Math.round(n.z));
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onRightClick(x, y, z);
      }}
    />
  );
}

export function VoxelGrid({
  onPlace,
  onRemove,
}: {
  onPlace: (x: number, y: number, z: number) => void;
  onRemove: (x: number, y: number, z: number) => void;
}) {
  const blocks = useEditorStore((s) => s.blocks);
  const toolMode = useEditorStore((s) => s.toolMode);

  const handleLeftClick = (
    bx: number,
    by: number,
    bz: number,
    nx: number,
    ny: number,
    nz: number,
  ) => {
    if (toolMode === "erase") {
      onRemove(bx, by, bz);
    } else {
      // Place on the adjacent face
      onPlace(bx + nx, by + ny, bz + nz);
    }
  };

  const handleRightClick = (bx: number, by: number, bz: number) => {
    onRemove(bx, by, bz);
  };

  return (
    <>
      {Array.from(blocks.values()).map((b) => (
        <VoxelMesh
          key={b.id}
          x={b.x}
          y={b.y}
          z={b.z}
          blockId={b.blockId}
          onLeftClick={handleLeftClick}
          onRightClick={handleRightClick}
        />
      ))}
    </>
  );
}
