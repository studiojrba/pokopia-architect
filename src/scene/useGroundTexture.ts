import { useEffect, useState } from "react";
import * as THREE from "three";
import type { RegionId } from "../data/regions";

const TILE_SLUG: Record<RegionId, string> = {
  witheredWasteland: "witheredwastelands",
  bleakBeach: "bleakbeach",
  rockyRidges: "rockyridges",
  sparklingSkylands: "sparklingskylands",
  paletteTown: "palettetown",
};

// We use z=2 tiles: 8×8 grid, each 256px → 2048×2048 total
const ZOOM = 2;
const GRID = 8;
const TILE_PX = 256;

export function useGroundTexture(region: RegionId): THREE.CanvasTexture | null {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let cancelled = false;
    const slug = TILE_SLUG[region];
    const canvasSize = TILE_PX * GRID; // 2048

    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext("2d")!;

    const promises: Promise<void>[] = [];

    for (let tx = 0; tx < GRID; tx++) {
      for (let ty = 0; ty < GRID; ty++) {
        promises.push(
          new Promise<void>((resolve) => {
            const img = new Image();
            // Tiles: tile_{z}-{x}-{y}.png
            // x is the column (left→right), y is the row (top→down)
            img.src = `/serebii/maps/${slug}/tile_${ZOOM}-${tx}-${ty}.png`;
            img.onload = () => {
              ctx.drawImage(img, tx * TILE_PX, ty * TILE_PX);
              resolve();
            };
            img.onerror = () => resolve(); // skip gracefully
          }),
        );
      }
    }

    Promise.all(promises).then(() => {
      if (cancelled) return;
      const tex = new THREE.CanvasTexture(canvas);
      // Don't flip Y — we want canvas row 0 (top of map) to map to Three's UV v=0.
      // PlaneGeometry after rotation-X(-π/2): UV (0,0) is at world (−w/2, 0, +d/2).
      // With flipY=false the top-left of the canvas appears at (−w/2, 0, +d/2),
      // i.e. the "near" edge of the ground from the default camera perspective.
      tex.flipY = false;
      tex.needsUpdate = true;
      setTexture((prev) => {
        prev?.dispose();
        return tex;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [region]);

  return texture;
}
