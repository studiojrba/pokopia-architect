import { useMemo, useState } from "react";
import {
  habitats as ALL_HABITATS,
  pokemon as ALL_POKEMON,
  type Habitat,
  type Pokemon,
} from "../../data/loadGenerated";
import { SearchBar } from "../common/SearchBar";
import { FilterChip } from "../common/FilterChip";
import { PokemonSprite } from "../common/PokemonSprite";

const POKEMON_BY_HABITAT: Map<string, Pokemon[]> = (() => {
  const m = new Map<string, Pokemon[]>();
  for (const p of ALL_POKEMON) {
    for (const h of p.habitats) {
      const key = h.name.toLowerCase();
      const arr = m.get(key) ?? [];
      arr.push(p);
      m.set(key, arr);
    }
  }
  return m;
})();

type Mode = "all" | "standard" | "event";

const MODE_LABEL: Record<Mode, string> = {
  all: "All",
  standard: "Standard",
  event: "Event",
};

export function HabitatsTab() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("all");
  const [selected, setSelected] = useState<Habitat | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_HABITATS.filter((h) => {
      if (mode === "standard" && h.isEvent) return false;
      if (mode === "event" && !h.isEvent) return false;
      if (q && !h.name.toLowerCase().includes(q) && !h.description.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [query, mode]);

  const counts = useMemo(() => {
    const standard = ALL_HABITATS.filter((h) => !h.isEvent).length;
    const event = ALL_HABITATS.length - standard;
    return { all: ALL_HABITATS.length, standard, event };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3">
        <div className="flex items-center gap-2">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search habitats by name or description..."
            resultCount={filtered.length}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "standard", "event"] as Mode[]).map((m) => (
            <FilterChip
              key={m}
              label={MODE_LABEL[m]}
              count={counts[m]}
              active={mode === m}
              onClick={() => setMode(m)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
              No habitats match these filters.
            </div>
          ) : (
            <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
              {filtered.map((h) => (
                <HabitatCard
                  key={h.id}
                  habitat={h}
                  selected={selected?.id === h.id}
                  onClick={() => setSelected(h)}
                />
              ))}
            </div>
          )}
        </div>
        <HabitatDetail habitat={selected} />
      </div>
    </div>
  );
}

interface HabitatCardProps {
  habitat: Habitat;
  selected: boolean;
  onClick: () => void;
}

function HabitatCard({ habitat, selected, onClick }: HabitatCardProps) {
  const pokemonCount = POKEMON_BY_HABITAT.get(habitat.name.toLowerCase())?.length ?? 0;
  return (
    <button
      onClick={onClick}
      className={
        "flex flex-col gap-1 rounded border p-3 text-left transition-colors " +
        (selected
          ? "border-[var(--color-accent)] bg-[var(--color-panel-hi)]"
          : "border-[var(--color-border)] bg-[var(--color-panel)] hover:border-[var(--color-accent)]")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
          #{habitat.id}
        </span>
        <div className="flex items-center gap-1">
          {habitat.isEvent && (
            <span className="rounded bg-[var(--color-accent)] px-1.5 py-0.5 text-[9px] uppercase text-black">
              Event
            </span>
          )}
          {pokemonCount > 0 && (
            <span className="text-[10px] text-[var(--color-muted)]">
              {pokemonCount} Pokemon
            </span>
          )}
        </div>
      </div>
      <div className="text-sm font-medium leading-tight">{habitat.name}</div>
      <div className="line-clamp-2 text-xs text-[var(--color-muted)]">
        {habitat.description}
      </div>
    </button>
  );
}

interface HabitatDetailProps {
  habitat: Habitat | null;
}

function HabitatDetail({ habitat }: HabitatDetailProps) {
  if (!habitat) {
    return (
      <aside className="hidden w-[360px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-panel)] p-4 text-sm text-[var(--color-muted)] lg:block">
        Select a habitat to see details.
      </aside>
    );
  }

  const pokemonHere = POKEMON_BY_HABITAT.get(habitat.name.toLowerCase()) ?? [];

  return (
    <aside className="hidden w-[360px] shrink-0 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-panel)] p-4 lg:block">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="text-xs text-[var(--color-muted)]">#{habitat.id}</div>
          <div className="text-lg font-semibold leading-tight">{habitat.name}</div>
          {habitat.isEvent && (
            <span className="mt-1 inline-block rounded bg-[var(--color-accent)] px-2 py-0.5 text-[10px] uppercase text-black">
              Event Habitat
            </span>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm text-[var(--color-text)]">{habitat.description}</p>

      {pokemonHere.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Found here ({pokemonHere.length})
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {pokemonHere.map((p) => (
              <div
                key={`${p.number}-${p.name}`}
                className="flex flex-col items-center gap-0.5 rounded border border-[var(--color-border)] bg-[var(--color-panel-hi)] p-1.5"
                title={p.name}
              >
                <PokemonSprite
                  name={p.name}
                  nationalDex={p.nationalDex}
                  size={48}
                />
                <span className="line-clamp-1 w-full text-center text-[9px] text-[var(--color-muted)]">
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
