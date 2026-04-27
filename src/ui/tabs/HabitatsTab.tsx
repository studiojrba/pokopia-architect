import { useMemo, useState } from "react";
import {
  habitats as ALL_HABITATS,
  pokemon as ALL_POKEMON,
  habitatImageUrl,
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
const MODE_LABEL: Record<Mode, string> = { all: "All", standard: "Standard", event: "Event" };

export function HabitatsTab() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("all");
  const [selected, setSelected] = useState<Habitat | null>(null);

  const counts = useMemo(() => {
    const standard = ALL_HABITATS.filter((h) => !h.isEvent).length;
    const event = ALL_HABITATS.length - standard;
    return { all: ALL_HABITATS.length, standard, event };
  }, []);

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
        <div className="text-[10px] text-[var(--color-muted)]">
          Habitat data and icons courtesy of{" "}
          <a
            href="https://www.serebii.net/pokemonpokopia/habitats.shtml"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-[var(--color-accent)]"
          >
            Serebii.net
          </a>
          .
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
              No habitats match these filters.
            </div>
          ) : (
            <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
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
  const img = habitatImageUrl(habitat.image);
  return (
    <button
      onClick={onClick}
      className={
        "flex flex-col gap-1.5 rounded border p-2.5 text-left transition-colors " +
        (selected
          ? "border-[var(--color-accent)] bg-[var(--color-panel-hi)]"
          : "border-[var(--color-border)] bg-[var(--color-panel)] hover:border-[var(--color-accent)]")
      }
    >
      <div className="flex items-center gap-2">
        {img ? (
          <img
            src={img}
            alt={habitat.name}
            className="h-12 w-12 shrink-0 rounded bg-[var(--color-panel-hi)] object-contain p-0.5"
            loading="lazy"
          />
        ) : (
          <div className="h-12 w-12 shrink-0 rounded bg-[var(--color-panel-hi)]" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              {habitat.numberStr}
            </span>
            <div className="flex items-center gap-1">
              {habitat.isEvent && (
                <span className="rounded bg-[var(--color-accent)] px-1.5 py-0.5 text-[9px] uppercase text-black">
                  Event
                </span>
              )}
              {pokemonCount > 0 && (
                <span className="text-[10px] text-[var(--color-muted)]">
                  {pokemonCount}
                </span>
              )}
            </div>
          </div>
          <div className="truncate text-sm font-medium leading-tight">
            {habitat.name}
          </div>
        </div>
      </div>
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
  const img = habitatImageUrl(habitat.image);

  return (
    <aside className="hidden w-[360px] shrink-0 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-panel)] p-4 lg:block">
      <div className="flex items-start gap-3">
        {img && (
          <img
            src={img}
            alt={habitat.name}
            className="h-20 w-20 shrink-0 rounded bg-[var(--color-panel-hi)] object-contain p-1"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--color-muted)]">{habitat.numberStr}</span>
            {habitat.isEvent && (
              <span className="rounded bg-[var(--color-accent)] px-1.5 py-0.5 text-[9px] uppercase text-black">
                Event
              </span>
            )}
          </div>
          <div className="text-lg font-semibold leading-tight">{habitat.name}</div>
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
