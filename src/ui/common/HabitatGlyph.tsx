import type { ReactElement } from "react";
import type { HabitatType } from "../../data/regions";

export const HABITAT_TYPES: HabitatType[] = [
  "Bright",
  "Cool",
  "Dark",
  "Dry",
  "Humid",
  "Warm",
];

export const HABITAT_COLORS: Record<HabitatType, string> = {
  Bright: "#f5b942",
  Cool: "#6cc4f5",
  Dark: "#8b6cf5",
  Dry: "#c9a36a",
  Humid: "#4ea1ff",
  Warm: "#f57f4a",
};

const ICONS: Record<HabitatType, ReactElement> = {
  Bright: (
    <g>
      <circle cx="12" cy="12" r="4" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="4.9" y1="4.9" x2="7" y2="7" />
        <line x1="17" y1="17" x2="19.1" y2="19.1" />
        <line x1="4.9" y1="19.1" x2="7" y2="17" />
        <line x1="17" y1="7" x2="19.1" y2="4.9" />
      </g>
    </g>
  ),
  Cool: (
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </g>
  ),
  Dark: (
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  ),
  Dry: (
    <g>
      <path d="M9 22V6a3 3 0 0 1 6 0v16" />
      <path d="M9 12H6a2 2 0 0 1 0-4h3" />
      <path d="M15 16h3a2 2 0 0 0 0-4h-3" />
    </g>
  ),
  Humid: (
    <path d="M12 2.69 5.5 10.4a8 8 0 0 0 13 0L12 2.69z" />
  ),
  Warm: (
    <path d="M12 2c1 4 4 5 4 9a4 4 0 1 1-8 0c0-2 1-3 2-4-1 0 0 3 2 3 0-3-2-5 0-8z" />
  ),
};

interface HabitatGlyphProps {
  type: HabitatType;
  size?: number;
  showLabel?: boolean;
}

export function HabitatGlyph({ type, size = 16, showLabel = false }: HabitatGlyphProps) {
  const color = HABITAT_COLORS[type];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center justify-center rounded"
        style={{
          width: size,
          height: size,
          backgroundColor: color + "33",
          color,
        }}
        title={type}
      >
        <svg
          width={size * 0.7}
          height={size * 0.7}
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke={type === "Cool" || type === "Dry" ? "currentColor" : "none"}
          strokeWidth={type === "Cool" || type === "Dry" ? 2 : 0}
        >
          {ICONS[type]}
        </svg>
      </span>
      {showLabel && <span className="text-xs">{type}</span>}
    </span>
  );
}

export function isHabitatType(value: string): value is HabitatType {
  return (HABITAT_TYPES as string[]).includes(value);
}
