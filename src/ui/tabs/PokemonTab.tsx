import { useMemo, useState } from "react";
import {
  pokemon as ALL_POKEMON,
  type Pokemon,
  type PokemonHabitat,
} from "../../data/loadGenerated";
import { REGION_LIST, type RegionId } from "../../data/regions";
import { SearchBar } from "../common/SearchBar";
import { FilterChip } from "../common/FilterChip";
import {
  HABITAT_COLORS,
  HABITAT_TYPES,
  HabitatGlyph,
  isHabitatType,
} from "../common/HabitatGlyph";
import { PokemonSprite } from "../common/PokemonSprite";
import { RegionBadge } from "../common/RegionBadge";

const ALL_SPECIALTIES = Array.from(
  new Set(ALL_POKEMON.flatMap((p) => p.specialties)),
)
  .filter((s) => !s.startsWith("?"))
  .sort();

export function PokemonTab() {
  const [query, setQuery] = useState("");
  const [regions, setRegions] = useState<Set<RegionId>>(new Set());
  const [habitatTypes, setHabitatTypes] = useState<Set<string>>(new Set());
  const [specialties, setSpecialties] = useState<Set<string>>(new Set());
  const [showAllSpecialties, setShowAllSpecialties] = useState(false);
  const [selected, setSelected] = useState<Pokemon | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_POKEMON.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (habitatTypes.size > 0 && !habitatTypes.has(p.idealHabitat)) return false;
      if (specialties.size > 0 && !p.specialties.some((s) => specialties.has(s))) {
        return false;
      }
      if (regions.size > 0) {
        const ok = p.habitats.some((h) =>
          [...regions].some((r) => h.available[r] === true),
        );
        if (!ok) return false;
      }
      return true;
    });
  }, [query, regions, habitatTypes, specialties]);

  const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const visibleSpecialties = showAllSpecialties
    ? ALL_SPECIALTIES
    : ALL_SPECIALTIES.slice(0, 8);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3">
        <div className="flex items-center gap-2">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search Pokemon by name..."
            resultCount={filtered.length}
          />
          {(regions.size > 0 || habitatTypes.size > 0 || specialties.size > 0 || query) && (
            <button
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
              onClick={() => {
                setQuery("");
                setRegions(new Set());
                setHabitatTypes(new Set());
                setSpecialties(new Set());
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            Region
          </span>
          {REGION_LIST.map((r) => (
            <FilterChip
              key={r.id}
              label={r.name}
              active={regions.has(r.id)}
              accent={r.ground}
              onClick={() => setRegions((s) => toggle(s, r.id))}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            Ideal habitat
          </span>
          {HABITAT_TYPES.map((t) => (
            <FilterChip
              key={t}
              label={
                <span className="flex items-center gap-1.5">
                  <HabitatGlyph type={t} size={12} />
                  {t}
                </span>
              }
              active={habitatTypes.has(t)}
              accent={HABITAT_COLORS[t]}
              onClick={() => setHabitatTypes((s) => toggle(s, t))}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            Specialty
          </span>
          {visibleSpecialties.map((s) => (
            <FilterChip
              key={s}
              label={s}
              active={specialties.has(s)}
              onClick={() => setSpecialties((set) => toggle(set, s))}
            />
          ))}
          {ALL_SPECIALTIES.length > 8 && (
            <button
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
              onClick={() => setShowAllSpecialties((v) => !v)}
            >
              {showAllSpecialties ? "Show fewer" : `+${ALL_SPECIALTIES.length - 8} more`}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
              No Pokemon match these filters.
            </div>
          ) : (
            <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(110px,1fr))]">
              {filtered.map((p) => (
                <PokemonCard
                  key={`${p.number}-${p.name}`}
                  pokemon={p}
                  selected={selected === p}
                  onClick={() => setSelected(p)}
                />
              ))}
            </div>
          )}
        </div>
        <PokemonDetail pokemon={selected} />
      </div>
    </div>
  );
}

interface PokemonCardProps {
  pokemon: Pokemon;
  selected: boolean;
  onClick: () => void;
}

function PokemonCard({ pokemon, selected, onClick }: PokemonCardProps) {
  return (
    <button
      onClick={onClick}
      className={
        "flex flex-col items-center gap-1 rounded border p-2 text-center transition-colors " +
        (selected
          ? "border-[var(--color-accent)] bg-[var(--color-panel-hi)]"
          : "border-[var(--color-border)] bg-[var(--color-panel)] hover:border-[var(--color-accent)]")
      }
    >
      <PokemonSprite dex={pokemon.number} name={pokemon.name} size={72} />
      <div className="flex w-full items-center justify-between gap-1 px-1">
        <span className="text-[10px] text-[var(--color-muted)]">
          {pokemon.numberStr}
        </span>
        {isHabitatType(pokemon.idealHabitat) && (
          <HabitatGlyph type={pokemon.idealHabitat} size={14} />
        )}
      </div>
      <div className="line-clamp-2 text-xs leading-tight">{pokemon.name}</div>
    </button>
  );
}

interface PokemonDetailProps {
  pokemon: Pokemon | null;
}

function PokemonDetail({ pokemon }: PokemonDetailProps) {
  if (!pokemon) {
    return (
      <aside className="hidden w-[360px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-panel)] p-4 text-sm text-[var(--color-muted)] lg:block">
        Select a Pokemon to see details.
      </aside>
    );
  }

  return (
    <aside className="hidden w-[360px] shrink-0 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-panel)] p-4 lg:block">
      <div className="flex items-start gap-3">
        <PokemonSprite dex={pokemon.number} name={pokemon.name} size={96} />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-[var(--color-muted)]">{pokemon.numberStr}</div>
          <div className="text-lg font-semibold leading-tight">{pokemon.name}</div>
          {pokemon.primaryLocation && (
            <div className="mt-1 text-xs text-[var(--color-muted)]">
              Primary: {pokemon.primaryLocation}
            </div>
          )}
          {isHabitatType(pokemon.idealHabitat) && (
            <div className="mt-2">
              <HabitatGlyph type={pokemon.idealHabitat} size={20} showLabel />
            </div>
          )}
        </div>
      </div>

      {pokemon.specialties.length > 0 && (
        <Section title="Specialties">
          <div className="flex flex-wrap gap-1.5">
            {pokemon.specialties.map((s) => (
              <span
                key={s}
                className="rounded bg-[var(--color-panel-hi)] px-2 py-0.5 text-xs"
              >
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {pokemon.favorites.length > 0 && (
        <Section title="Favorites">
          <ol className="space-y-0.5 text-xs">
            {pokemon.favorites.map((f, i) => (
              <li key={f} className="flex items-baseline gap-2">
                <span className="w-4 text-[var(--color-muted)]">{i + 1}.</span>
                <span>{f}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {pokemon.habitats.length > 0 && (
        <Section title="Habitats">
          <div className="space-y-3">
            {pokemon.habitats.map((h) => (
              <HabitatRow key={h.name} habitat={h} />
            ))}
          </div>
        </Section>
      )}
    </aside>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="mt-4">
      <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        {title}
      </h3>
      {children}
    </div>
  );
}

function HabitatRow({ habitat }: { habitat: PokemonHabitat }) {
  const availableRegions = REGION_LIST.filter(
    (r) => habitat.available[r.id] === true,
  );
  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-panel-hi)] p-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{habitat.name}</span>
        {habitat.rarity && (
          <span className="text-[10px] uppercase text-[var(--color-muted)]">
            {habitat.rarity}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {availableRegions.map((r) => (
          <RegionBadge key={r.id} region={r.id} />
        ))}
      </div>
      {(habitat.timesOfDay?.length || habitat.weathers?.length) && (
        <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-[var(--color-muted)]">
          {habitat.timesOfDay && habitat.timesOfDay.length > 0 && (
            <span>Time: {habitat.timesOfDay.join(", ")}</span>
          )}
          {habitat.weathers && habitat.weathers.length > 0 && (
            <span>Weather: {habitat.weathers.join(", ")}</span>
          )}
        </div>
      )}
    </div>
  );
}
