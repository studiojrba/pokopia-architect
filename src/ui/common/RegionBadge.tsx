import type { RegionId } from "../../data/regions";
import { REGIONS } from "../../data/regions";
import type { LocationRegionId } from "../../data/loadGenerated";

const DREAM_ISLAND_COLOR = "#d8a4ff";

interface RegionBadgeProps {
  region: LocationRegionId;
  size?: "sm" | "md";
}

export function RegionBadge({ region, size = "sm" }: RegionBadgeProps) {
  const isDream = region === "dreamIsland";
  const color = isDream ? DREAM_ISLAND_COLOR : REGIONS[region as RegionId].ground;
  const name = isDream ? "Dream Island" : REGIONS[region as RegionId].name;
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded border " +
        (size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs")
      }
      style={{
        borderColor: color + "66",
        backgroundColor: color + "1f",
        color,
      }}
    >
      <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}
