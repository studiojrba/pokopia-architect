export type RegionId =
  | "witheredWasteland"
  | "bleakBeach"
  | "rockyRidges"
  | "sparklingSkylands"
  | "paletteTown";

export type HabitatType = "Bright" | "Cool" | "Dark" | "Dry" | "Humid" | "Warm";

export interface RegionDef {
  id: RegionId;
  name: string;
  size: { x: number; y: number; z: number };
  ground: string;
  sky: string;
  habitatTypes: HabitatType[];
  notes: string;
}

// Region sizes sourced from JEschete/PokopiaPlanning area summary.
// Map height of 127 blocks vertical applies to all areas.
export const REGIONS: Record<RegionId, RegionDef> = {
  witheredWasteland: {
    id: "witheredWasteland",
    name: "Withered Wastelands",
    size: { x: 240, y: 127, z: 240 },
    ground: "#9b8b66",
    sky: "#d8c79a",
    habitatTypes: ["Bright", "Dark", "Dry", "Humid", "Warm"],
    notes: "Drought-stricken grassland; based on Fuchsia City.",
  },
  bleakBeach: {
    id: "bleakBeach",
    name: "Bleak Beach",
    size: { x: 272, y: 127, z: 272 },
    ground: "#e8d49a",
    sky: "#7fa4b8",
    habitatTypes: ["Bright", "Cool", "Dark", "Humid", "Warm"],
    notes: "Flooded coastal town; based on Vermilion City.",
  },
  rockyRidges: {
    id: "rockyRidges",
    name: "Rocky Ridges",
    size: { x: 272, y: 127, z: 272 },
    ground: "#7d7268",
    sky: "#c4bfb8",
    habitatTypes: ["Bright", "Cool", "Dark", "Dry", "Humid", "Warm"],
    notes: "Mountains, hot springs and lava; based on Pewter City.",
  },
  sparklingSkylands: {
    id: "sparklingSkylands",
    name: "Sparkling Skylands",
    size: { x: 352, y: 127, z: 352 },
    ground: "#cfe6ff",
    sky: "#a9d4ff",
    habitatTypes: ["Bright", "Cool", "Dark", "Dry", "Humid", "Warm"],
    notes: "Elevated platforms and clouds; based on Celadon City.",
  },
  paletteTown: {
    id: "paletteTown",
    name: "Palette Town",
    size: { x: 384, y: 127, z: 384 },
    ground: "#a4c98a",
    sky: "#b8dcef",
    habitatTypes: ["Bright", "Cool", "Dark", "Humid", "Warm"],
    notes: "Post-game sandbox area with mixed terrain.",
  },
};

export const REGION_LIST: RegionDef[] = Object.values(REGIONS);
