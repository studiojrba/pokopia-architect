import { useMemo, useState } from "react";
import {
  houseGroups as ALL_GROUPS,
  type HouseGroup,
  type HouseGroupPokemon,
} from "../../data/loadGenerated";
import { REGION_LIST, REGIONS, type RegionId } from "../../data/regions";
import { FilterChip } from "../common/FilterChip";
import { SearchBar } from "../common/SearchBar";
import {
  HABITAT_COLORS,
  HABITAT_TYPES,
  HabitatGlyph,
  isHabitatType,
} from "../common/HabitatGlyph";
import { PokemonSprite } from "../common/PokemonSprite";
import { RegionBadge } from "../common/RegionBadge";

export function HousesTab() {
  const [region, setRegion] = useState<RegionId | "all">("all");
  const [habitatType, setHabitatType] = useState<string | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<HouseGroup | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_GROUPS.filter((g) => {
      if (region !== "all" && g.region !== region) return false;
      if (habitatType !== "all" && g.habitatType !== habitatType) return false;
      if (q) {
        const hay = [
          g.title,
          ...g.pokemon.map((p) => p.name),
          ...g.shared,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [region, habitatType, query]);

  const groupedByRegion = useMemo(() => {
    const m = new Map<RegionId, HouseGroup[]>();
    for (const g of filtered) {
      const arr = m.get(g.region) ?? [];
      arr.push(g);
      m.set(g.region, arr);
    }
    return m;
  }, [filtered]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3">
        <div className="flex items-center gap-2">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search houses by title, Pokemon, or favorite..."
            resultCount={filtered.length}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            Region
          </span>
          <FilterChip
            label="All"
            active={region === "all"}
            onClick={() => setRegion("all")}
          />
          {REGION_LIST.map((r) => (
            <FilterChip
              key={r.id}
              label={r.name}
              accent={r.ground}
              active={region === r.id}
              onClick={() => setRegion(r.id)}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            Habitat
          </span>
          <FilterChip
            label="All"
            active={habitatType === "all"}
            onClick={() => setHabitatType("all")}
          />
          {HABITAT_TYPES.map((t) => (
            <FilterChip
              key={t}
              label={
                <span className="flex items-center gap-1.5">
                  <HabitatGlyph type={t} size={12} />
                  {t}
                </span>
              }
              accent={HABITAT_COLORS[t]}
              active={habitatType === t}
              onClick={() => setHabitatType(t)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
              No house groups match these filters.
            </div>
          ) : (
            <div className="space-y-6">
              {REGION_LIST.filter((r) => groupedByRegion.has(r.id)).map((r) => (
                <section key={r.id}>
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <span
                      className="inline-block h-3 w-3 rounded-sm"
                      style={{ backgroundColor: r.ground }}
                    />
                    {r.name}
                    <span className="text-xs font-normal text-[var(--color-muted)]">
                      {groupedByRegion.get(r.id)?.length ?? 0} houses
                    </span>
                  </h2>
                  <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
                    {(groupedByRegion.get(r.id) ?? []).map((g) => (
                      <HouseCard
                        key={`${g.region}-${g.habitatType}-${g.number}`}
                        group={g}
                        selected={selected === g}
                        onClick={() => setSelected(g)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
        <HouseDetail group={selected} />
      </div>
    </div>
  );
}

interface HouseCardProps {
  group: HouseGroup;
  selected: boolean;
  onClick: () => void;
}

function HouseCard({ group, selected, onClick }: HouseCardProps) {
  return (
    <button
      onClick={onClick}
      className={
        "flex flex-col gap-2 rounded border p-3 text-left transition-colors " +
        (selected
          ? "border-[var(--color-accent)] bg-[var(--color-panel-hi)]"
          : "border-[var(--color-border)] bg-[var(--color-panel)] hover:border-[var(--color-accent)]")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
          House {group.number}
        </span>
        {isHabitatType(group.habitatType) && (
          <HabitatGlyph type={group.habitatType} size={14} showLabel />
        )}
      </div>
      <div className="text-sm font-medium leading-tight">{group.title}</div>
      <div className="flex -space-x-2">
        {group.pokemon.slice(0, 6).map((p) => (
          <div
            key={`${p.number}-${p.name}`}
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel-hi)]"
            title={p.name}
          >
            <PokemonSprite dex={p.number} name={p.name} size={36} />
          </div>
        ))}
        {group.pokemon.length > 6 && (
          <span className="ml-2 self-center text-xs text-[var(--color-muted)]">
            +{group.pokemon.length - 6}
          </span>
        )}
      </div>
      {group.shared.length > 0 && (
        <div className="text-[11px] text-[var(--color-muted)]">
          Shared: {group.shared.slice(0, 3).join(", ")}
          {group.shared.length > 3 && ` +${group.shared.length - 3}`}
        </div>
      )}
    </button>
  );
}

interface HouseDetailProps {
  group: HouseGroup | null;
}

function HouseDetail({ group }: HouseDetailProps) {
  if (!group) {
    return (
      <aside className="hidden w-[400px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-panel)] p-4 text-sm text-[var(--color-muted)] lg:block">
        Select a house to see members and item suggestions.
      </aside>
    );
  }
  const region = REGIONS[group.region];

  return (
    <aside className="hidden w-[400px] shrink-0 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-panel)] p-4 lg:block">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-muted)]">House {group.number}</span>
          <RegionBadge region={group.region} />
          {isHabitatType(group.habitatType) && (
            <HabitatGlyph type={group.habitatType} size={16} showLabel />
          )}
        </div>
        <div className="mt-1 text-lg font-semibold leading-tight">{group.title}</div>
        <div className="mt-0.5 text-[11px] text-[var(--color-muted)]">{region.name}</div>
      </div>

      {group.shared.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Shared favorites
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {group.shared.map((s) => (
              <span
                key={s}
                className="rounded bg-[var(--color-panel-hi)] px-2 py-0.5 text-xs"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
          Members ({group.pokemon.length})
        </h3>
        <div className="space-y-2">
          {group.pokemon.map((p) => (
            <MemberRow key={`${p.number}-${p.name}`} pokemon={p} shared={group.shared} />
          ))}
        </div>
      </div>

      {group.suggestedItems.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Suggested items
          </h3>
          <div className="space-y-2">
            {group.suggestedItems.map((s) => (
              <div
                key={s.favorite}
                className="rounded border border-[var(--color-border)] bg-[var(--color-panel-hi)] p-2"
              >
                <div className="text-[11px] font-semibold">{s.favorite}</div>
                <div className="mt-0.5 text-xs text-[var(--color-muted)]">
                  {s.items.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

interface MemberRowProps {
  pokemon: HouseGroupPokemon;
  shared: string[];
}

function MemberRow({ pokemon, shared }: MemberRowProps) {
  const sharedLower = new Set(shared.map((s) => s.toLowerCase()));
  return (
    <div className="flex items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-panel-hi)] p-2">
      <PokemonSprite dex={pokemon.number} name={pokemon.name} size={48} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] text-[var(--color-muted)]">
            {pokemon.numberStr}
          </span>
          <span className="truncate text-sm font-medium">{pokemon.name}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-1">
          {pokemon.favorites.map((f) => {
            const isShared = sharedLower.has(f.toLowerCase());
            return (
              <span
                key={f}
                className={
                  "rounded px-1.5 py-0.5 text-[10px] " +
                  (isShared
                    ? "bg-[var(--color-accent)] text-black"
                    : "bg-black/30 text-[var(--color-muted)]")
                }
              >
                {f}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
