import { useState } from "react";
import { pokemonSpriteUrl } from "../../data/loadGenerated";

interface PokemonSpriteProps {
  dex: number;
  name: string;
  size?: number;
}

export function PokemonSprite({ dex, name, size = 64 }: PokemonSpriteProps) {
  const url = pokemonSpriteUrl(dex);
  const [errored, setErrored] = useState(false);

  if (!url || errored) {
    const initials = name
      .replace(/\s+(Form|Sea)\s.*$/, "")
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2);
    return (
      <div
        className="flex items-center justify-center rounded bg-[var(--color-panel-hi)] text-[var(--color-muted)]"
        style={{ width: size, height: size, fontSize: size * 0.35 }}
        title={name}
      >
        {initials || "?"}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setErrored(true)}
      className="select-none"
      style={{ imageRendering: "pixelated", width: size, height: size }}
    />
  );
}
