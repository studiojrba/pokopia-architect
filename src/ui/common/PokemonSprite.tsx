import { useState } from "react";
import { pokemonByName, pokemonSpriteUrl } from "../../data/loadGenerated";

interface PokemonSpriteProps {
  name: string;
  /**
   * Official National Pokedex number, used to fetch the sprite. If omitted,
   * it is resolved from `name` via the generated Pokemon index. Pokopia's
   * internal dex number must NOT be passed here — it does not match the
   * National Pokedex (e.g. Pokopia #298 = Ho-Oh, but national #298 = Azurill).
   */
  nationalDex?: number | null;
  size?: number;
}

export function PokemonSprite({ name, nationalDex, size = 64 }: PokemonSpriteProps) {
  const resolvedDex =
    nationalDex !== undefined
      ? nationalDex
      : (pokemonByName.get(name.toLowerCase())?.nationalDex ?? null);
  const url = pokemonSpriteUrl(resolvedDex);
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
