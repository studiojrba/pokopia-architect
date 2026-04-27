import { useMemo, useState } from "react";
import {
  items as ALL_ITEMS,
  itemsByFavorite as ALL_FAVORITES,
  type Item,
} from "../../data/loadGenerated";
import { SearchBar } from "../common/SearchBar";
import { FilterChip } from "../common/FilterChip";
import { CategoryBadge, categoryColor } from "../common/CategoryBadge";

const ALL_CATEGORIES = Array.from(new Set(ALL_ITEMS.map((i) => i.category))).sort();
const ALL_FAVORITE_NAMES = ALL_FAVORITES.map((f) => f.category).sort();

const FAVORITES_BY_ITEM: Map<string, string[]> = (() => {
  const m = new Map<string, string[]>();
  for (const fav of ALL_FAVORITES) {
    for (const i of fav.items) {
      const key = i.name.toLowerCase();
      const arr = m.get(key) ?? [];
      arr.push(fav.category);
      m.set(key, arr);
    }
  }
  return m;
})();

export function ItemsTab() {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showAllFavorites, setShowAllFavorites] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_ITEMS.filter((i) => {
      if (categories.size > 0 && !categories.has(i.category)) return false;
      if (favorites.size > 0) {
        const favs = FAVORITES_BY_ITEM.get(i.name.toLowerCase()) ?? [];
        if (!favs.some((f) => favorites.has(f))) return false;
      }
      if (q) {
        if (
          !i.name.toLowerCase().includes(q) &&
          !i.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [query, categories, favorites]);

  const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const visibleFavorites = showAllFavorites
    ? ALL_FAVORITE_NAMES
    : ALL_FAVORITE_NAMES.slice(0, 8);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3">
        <div className="flex items-center gap-2">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search items by name or description..."
            resultCount={filtered.length}
          />
          {(categories.size > 0 || favorites.size > 0 || query) && (
            <button
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
              onClick={() => {
                setQuery("");
                setCategories(new Set());
                setFavorites(new Set());
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            Category
          </span>
          {ALL_CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              label={c}
              accent={categoryColor(c)}
              active={categories.has(c)}
              onClick={() => setCategories((s) => toggle(s, c))}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            Favorite
          </span>
          {visibleFavorites.map((f) => (
            <FilterChip
              key={f}
              label={f}
              active={favorites.has(f)}
              onClick={() => setFavorites((s) => toggle(s, f))}
            />
          ))}
          {ALL_FAVORITE_NAMES.length > 8 && (
            <button
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
              onClick={() => setShowAllFavorites((v) => !v)}
            >
              {showAllFavorites
                ? "Show fewer"
                : `+${ALL_FAVORITE_NAMES.length - 8} more`}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
              No items match these filters.
            </div>
          ) : (
            <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
              {filtered.map((i) => (
                <ItemCard
                  key={`${i.category}-${i.name}`}
                  item={i}
                  selected={selected === i}
                  onClick={() => setSelected(i)}
                />
              ))}
            </div>
          )}
        </div>
        <ItemDetail item={selected} />
      </div>
    </div>
  );
}

interface ItemCardProps {
  item: Item;
  selected: boolean;
  onClick: () => void;
}

function ItemCard({ item, selected, onClick }: ItemCardProps) {
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
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight">{item.name}</span>
      </div>
      <CategoryBadge category={item.category} />
      {item.description && (
        <p className="line-clamp-2 text-[11px] text-[var(--color-muted)]">
          {item.description}
        </p>
      )}
    </button>
  );
}

interface ItemDetailProps {
  item: Item | null;
}

function ItemDetail({ item }: ItemDetailProps) {
  if (!item) {
    return (
      <aside className="hidden w-[360px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-panel)] p-4 text-sm text-[var(--color-muted)] lg:block">
        Select an item to see details.
      </aside>
    );
  }
  const favs = FAVORITES_BY_ITEM.get(item.name.toLowerCase()) ?? [];
  return (
    <aside className="hidden w-[360px] shrink-0 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-panel)] p-4 lg:block">
      <div>
        <CategoryBadge category={item.category} size="md" />
        <div className="mt-2 text-lg font-semibold leading-tight">{item.name}</div>
      </div>
      {item.description && (
        <p className="mt-3 text-sm text-[var(--color-text)]">{item.description}</p>
      )}

      {favs.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Favorite categories
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {favs.map((f) => (
              <span
                key={f}
                className="rounded bg-[var(--color-panel-hi)] px-2 py-0.5 text-xs"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {item.locations.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Locations
          </h3>
          <ul className="space-y-1 text-xs">
            {item.locations.map((loc, i) => (
              <li key={i} className="text-[var(--color-text)]">
                {loc}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
