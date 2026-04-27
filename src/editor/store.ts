import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { RegionId } from "../data/regions";
import { DEFAULT_HOTBAR } from "../data/blocks";

export type CameraMode = "orbit" | "topDown";
export type ToolMode = "build" | "erase" | "pan";

export interface PlacedBlock {
  id: string;
  blockId: string;
  x: number;
  y: number;
  z: number;
}

const cellKey = (x: number, y: number, z: number) => `${x},${y},${z}`;

const MAX_UNDO = 50;

// Serialize/deserialize Map for localStorage
function serializeBlocks(blocks: Map<string, PlacedBlock>): string {
  return JSON.stringify(Array.from(blocks.values()));
}
function deserializeBlocks(raw: string): Map<string, PlacedBlock> {
  try {
    const arr: PlacedBlock[] = JSON.parse(raw);
    return new Map(arr.map((b) => [cellKey(b.x, b.y, b.z), b]));
  } catch {
    return new Map();
  }
}

// Load persisted state from localStorage
function loadSaved(): { region: RegionId; blocks: Map<string, PlacedBlock> } | null {
  try {
    const raw = localStorage.getItem("pokopia.autosave");
    if (!raw) return null;
    const { region, blocks: blocksRaw } = JSON.parse(raw);
    return { region, blocks: deserializeBlocks(blocksRaw) };
  } catch {
    return null;
  }
}

const saved = loadSaved();

interface EditorState {
  region: RegionId;
  cameraMode: CameraMode;
  toolMode: ToolMode;
  selectedBlockId: string;
  hotbar: string[]; // 9 block IDs
  hotbarSlot: number; // 0-8
  blocks: Map<string, PlacedBlock>;
  undoStack: Map<string, PlacedBlock>[];
  redoStack: Map<string, PlacedBlock>[];
  showPalette: boolean;

  setRegion: (region: RegionId) => void;
  setCameraMode: (mode: CameraMode) => void;
  setToolMode: (mode: ToolMode) => void;
  setSelectedBlockId: (blockId: string) => void;
  setHotbarSlot: (slot: number) => void;
  setHotbarBlock: (slot: number, blockId: string) => void;
  togglePalette: () => void;
  placeBlock: (x: number, y: number, z: number) => void;
  removeBlock: (x: number, y: number, z: number) => void;
  undo: () => void;
  redo: () => void;
  clearAll: () => void;
}

export const useEditorStore = create<EditorState>()(
  subscribeWithSelector((set, get) => {
    const snapshot = (): Map<string, PlacedBlock> => new Map(get().blocks);

    const pushUndo = () => {
      const { undoStack } = get();
      const next = [...undoStack, snapshot()];
      return next.length > MAX_UNDO ? next.slice(next.length - MAX_UNDO) : next;
    };

    return {
      region: saved?.region ?? "witheredWasteland",
      cameraMode: "orbit",
      toolMode: "build",
      selectedBlockId: DEFAULT_HOTBAR[0],
      hotbar: DEFAULT_HOTBAR,
      hotbarSlot: 0,
      blocks: saved?.blocks ?? new Map(),
      undoStack: [],
      redoStack: [],
      showPalette: false,

      setRegion: (region) => set({ region }),
      setCameraMode: (cameraMode) => set({ cameraMode }),
      setToolMode: (toolMode) => set({ toolMode }),
      setSelectedBlockId: (selectedBlockId) => set({ selectedBlockId }),
      setHotbarSlot: (hotbarSlot) => {
        const { hotbar } = get();
        set({ hotbarSlot, selectedBlockId: hotbar[hotbarSlot] });
      },
      setHotbarBlock: (slot, blockId) => {
        const hotbar = [...get().hotbar];
        hotbar[slot] = blockId;
        set({ hotbar, hotbarSlot: slot, selectedBlockId: blockId });
      },
      togglePalette: () => set((s) => ({ showPalette: !s.showPalette })),

      placeBlock: (x, y, z) => {
        const { selectedBlockId, blocks } = get();
        const key = cellKey(x, y, z);
        if (blocks.get(key)?.blockId === selectedBlockId) return; // no-op
        const undo = pushUndo();
        const next = new Map(blocks);
        next.set(key, { id: key, blockId: selectedBlockId, x, y, z });
        set({ blocks: next, undoStack: undo, redoStack: [] });
      },

      removeBlock: (x, y, z) => {
        const { blocks } = get();
        const key = cellKey(x, y, z);
        if (!blocks.has(key)) return;
        const undo = pushUndo();
        const next = new Map(blocks);
        next.delete(key);
        set({ blocks: next, undoStack: undo, redoStack: [] });
      },

      undo: () => {
        const { undoStack, redoStack, blocks } = get();
        if (undoStack.length === 0) return;
        const prev = undoStack[undoStack.length - 1];
        set({
          blocks: prev,
          undoStack: undoStack.slice(0, -1),
          redoStack: [...redoStack, new Map(blocks)],
        });
      },

      redo: () => {
        const { undoStack, redoStack, blocks } = get();
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        set({
          blocks: next,
          redoStack: redoStack.slice(0, -1),
          undoStack: [...undoStack, new Map(blocks)],
        });
      },

      clearAll: () => {
        const undo = pushUndo();
        set({ blocks: new Map(), undoStack: undo, redoStack: [] });
      },
    };
  }),
);

// Autosave on every blocks change (debounced 500ms)
let saveTimer: ReturnType<typeof setTimeout> | null = null;
useEditorStore.subscribe(
  (s) => s.blocks,
  (blocks) => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const { region } = useEditorStore.getState();
        localStorage.setItem(
          "pokopia.autosave",
          JSON.stringify({ region, blocks: serializeBlocks(blocks) }),
        );
      } catch {
        // storage full or unavailable
      }
    }, 500);
  },
);
