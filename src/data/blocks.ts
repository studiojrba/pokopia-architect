import type { HabitatType } from "./regions";

export type BlockKind =
  | "wall"
  | "floor"
  | "roof"
  | "door"
  | "window"
  | "furniture"
  | "natural"
  | "habitat";

export interface BlockDef {
  id: string;
  name: string;
  kind: BlockKind;
  /** Hex color used for 3D rendering. */
  color: string;
  /** Emissive hex (for glowing / lit blocks). */
  emissive?: string;
  /**
   * Game-rule metadata consumed by validators and the Comfy calculator.
   * A block may satisfy multiple roles simultaneously (e.g. a lit habitat block).
   */
  countsAs?: {
    door?: boolean;
    furniture?: boolean;
    wall?: boolean;
    habitat?: HabitatType;
  };
  /** Favorite categories this block satisfies (for Comfy calc). */
  favoriteCategories?: string[];
}

// ---------------------------------------------------------------------------
// Block registry
// ---------------------------------------------------------------------------

export const BLOCKS: BlockDef[] = [
  // ── Natural / ground ────────────────────────────────────────────────────
  {
    id: "grass",
    name: "Grass",
    kind: "natural",
    color: "#5aa832",
  },
  {
    id: "dirt",
    name: "Dirt",
    kind: "natural",
    color: "#8b6543",
  },
  {
    id: "sand",
    name: "Sand",
    kind: "natural",
    color: "#e2c98a",
  },
  {
    id: "stone",
    name: "Stone",
    kind: "natural",
    color: "#7a7a7a",
  },
  {
    id: "water",
    name: "Water",
    kind: "natural",
    color: "#4488cc",
  },
  {
    id: "gravel",
    name: "Gravel",
    kind: "natural",
    color: "#9e9e90",
  },
  // ── Walls ───────────────────────────────────────────────────────────────
  {
    id: "wooden-wall",
    name: "Wooden Wall",
    kind: "wall",
    color: "#c8a96e",
    countsAs: { wall: true },
  },
  {
    id: "stone-wall",
    name: "Stone Wall",
    kind: "wall",
    color: "#888888",
    countsAs: { wall: true },
  },
  {
    id: "leaf-wall",
    name: "Leaf Wall",
    kind: "wall",
    color: "#3f8c3f",
    countsAs: { wall: true },
  },
  {
    id: "brick-wall",
    name: "Brick Wall",
    kind: "wall",
    color: "#a04030",
    countsAs: { wall: true },
  },
  {
    id: "sand-wall",
    name: "Sandy Wall",
    kind: "wall",
    color: "#d4b870",
    countsAs: { wall: true },
  },
  {
    id: "metal-wall",
    name: "Metal Wall",
    kind: "wall",
    color: "#7090a8",
    countsAs: { wall: true },
  },
  {
    id: "light-wooden-wall",
    name: "Light Wooden Wall",
    kind: "wall",
    color: "#dbbe8a",
    countsAs: { wall: true },
  },
  // ── Floors ──────────────────────────────────────────────────────────────
  {
    id: "wooden-floor",
    name: "Wooden Floor",
    kind: "floor",
    color: "#b8934a",
  },
  {
    id: "stone-floor",
    name: "Stone Floor",
    kind: "floor",
    color: "#909090",
  },
  {
    id: "tile-floor",
    name: "Tile Floor",
    kind: "floor",
    color: "#c8d8e8",
  },
  {
    id: "sand-floor",
    name: "Sand Floor",
    kind: "floor",
    color: "#e8d090",
  },
  {
    id: "grass-floor",
    name: "Grass Floor",
    kind: "floor",
    color: "#6aba42",
  },
  // ── Roofs ───────────────────────────────────────────────────────────────
  {
    id: "wooden-roof",
    name: "Wooden Roof",
    kind: "roof",
    color: "#8c6030",
  },
  {
    id: "leaf-roof",
    name: "Leaf Roof",
    kind: "roof",
    color: "#2f7030",
  },
  {
    id: "stone-roof",
    name: "Stone Roof",
    kind: "roof",
    color: "#686868",
  },
  {
    id: "thatch-roof",
    name: "Thatch Roof",
    kind: "roof",
    color: "#c8a040",
  },
  // ── Doors ───────────────────────────────────────────────────────────────
  {
    id: "wooden-door",
    name: "Wooden Door",
    kind: "door",
    color: "#a0703a",
    countsAs: { door: true, wall: true },
  },
  {
    id: "iron-door",
    name: "Iron Door",
    kind: "door",
    color: "#909898",
    countsAs: { door: true, wall: true },
  },
  // ── Windows ─────────────────────────────────────────────────────────────
  {
    id: "glass-window",
    name: "Glass Window",
    kind: "window",
    color: "#aad4f0",
    countsAs: { wall: true },
  },
  // ── Furniture ───────────────────────────────────────────────────────────
  {
    id: "bed",
    name: "Bed",
    kind: "furniture",
    color: "#e07070",
    countsAs: { furniture: true },
    favoriteCategories: ["Soft stuff"],
  },
  {
    id: "table",
    name: "Table",
    kind: "furniture",
    color: "#c09050",
    countsAs: { furniture: true },
    favoriteCategories: ["Misc. goods"],
  },
  {
    id: "chair",
    name: "Chair",
    kind: "furniture",
    color: "#b07840",
    countsAs: { furniture: true },
    favoriteCategories: ["Misc. goods"],
  },
  {
    id: "bookshelf",
    name: "Bookshelf",
    kind: "furniture",
    color: "#8060c0",
    countsAs: { furniture: true },
    favoriteCategories: ["Educational stuff"],
  },
  {
    id: "lamp",
    name: "Lamp",
    kind: "furniture",
    color: "#f0e060",
    emissive: "#806030",
    countsAs: { furniture: true },
    favoriteCategories: ["Illuminating stuff"],
  },
  {
    id: "rug",
    name: "Rug",
    kind: "furniture",
    color: "#c060a0",
    countsAs: { furniture: true },
    favoriteCategories: ["Soft stuff"],
  },
  {
    id: "vase",
    name: "Vase",
    kind: "furniture",
    color: "#50b8e0",
    countsAs: { furniture: true },
    favoriteCategories: ["Cute stuff"],
  },
  {
    id: "plush",
    name: "Plush Toy",
    kind: "furniture",
    color: "#e090d0",
    countsAs: { furniture: true },
    favoriteCategories: ["Cute stuff", "Soft stuff"],
  },
  {
    id: "food-bowl",
    name: "Food Bowl",
    kind: "furniture",
    color: "#f0a840",
    countsAs: { furniture: true },
    favoriteCategories: ["Tasty stuff"],
  },
  {
    id: "workbench",
    name: "Workbench",
    kind: "furniture",
    color: "#a08848",
    countsAs: { furniture: true },
    favoriteCategories: ["Misc. goods"],
  },
  // ── Habitat blocks ───────────────────────────────────────────────────────
  // These set the habitat type of a house when placed inside.
  {
    id: "tall-grass",
    name: "Tall Grass",
    kind: "habitat",
    color: "#78cc50",
    countsAs: { habitat: "Bright" },
  },
  {
    id: "campfire",
    name: "Campfire",
    kind: "habitat",
    color: "#ff8820",
    emissive: "#803010",
    countsAs: { habitat: "Warm", furniture: true },
    favoriteCategories: ["Misc. goods"],
  },
  {
    id: "pond",
    name: "Pond / Water Feature",
    kind: "habitat",
    color: "#3888e8",
    countsAs: { habitat: "Humid" },
  },
  {
    id: "grave-offering",
    name: "Grave Offering",
    kind: "habitat",
    color: "#505870",
    countsAs: { habitat: "Dark" },
  },
  {
    id: "elevated-turf",
    name: "Elevated Turf",
    kind: "habitat",
    color: "#58b8a0",
    countsAs: { habitat: "Cool" },
  },
  {
    id: "cactus",
    name: "Cactus",
    kind: "habitat",
    color: "#60a040",
    countsAs: { habitat: "Dry" },
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export const BLOCK_MAP: Map<string, BlockDef> = new Map(
  BLOCKS.map((b) => [b.id, b]),
);

export const BLOCKS_BY_KIND: Map<BlockKind, BlockDef[]> = (() => {
  const m = new Map<BlockKind, BlockDef[]>();
  for (const b of BLOCKS) {
    const arr = m.get(b.kind) ?? [];
    arr.push(b);
    m.set(b.kind, arr);
  }
  return m;
})();

export const KIND_LABELS: Record<BlockKind, string> = {
  natural: "Natural",
  wall: "Walls",
  floor: "Floors",
  roof: "Roofs",
  door: "Doors",
  window: "Windows",
  furniture: "Furniture",
  habitat: "Habitat",
};

export const DEFAULT_HOTBAR: string[] = [
  "wooden-wall",
  "wooden-floor",
  "wooden-roof",
  "wooden-door",
  "glass-window",
  "tall-grass",
  "campfire",
  "bed",
  "lamp",
];
