import { create } from "zustand";
import type { RegionId } from "../data/regions";

export type CameraMode = "orbit" | "firstPerson" | "topDown";

export interface PlacedBlock {
  id: string;
  blockId: string;
  x: number;
  y: number;
  z: number;
}

interface EditorState {
  region: RegionId;
  cameraMode: CameraMode;
  selectedBlockId: string | null;
  blocks: Map<string, PlacedBlock>;

  setRegion: (region: RegionId) => void;
  setCameraMode: (mode: CameraMode) => void;
  setSelectedBlockId: (blockId: string | null) => void;
  placeBlock: (x: number, y: number, z: number, blockId: string) => void;
  removeBlock: (x: number, y: number, z: number) => void;
}

const cellKey = (x: number, y: number, z: number) => `${x},${y},${z}`;

export const useEditorStore = create<EditorState>((set) => ({
  region: "witheredWasteland",
  cameraMode: "orbit",
  selectedBlockId: null,
  blocks: new Map(),

  setRegion: (region) => set({ region }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  setSelectedBlockId: (selectedBlockId) => set({ selectedBlockId }),

  placeBlock: (x, y, z, blockId) =>
    set((state) => {
      const next = new Map(state.blocks);
      const key = cellKey(x, y, z);
      next.set(key, { id: key, blockId, x, y, z });
      return { blocks: next };
    }),

  removeBlock: (x, y, z) =>
    set((state) => {
      const next = new Map(state.blocks);
      next.delete(cellKey(x, y, z));
      return { blocks: next };
    }),
}));
