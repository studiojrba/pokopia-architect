import { useMemo, useState } from "react";
import {
  items as ALL_ITEMS,
  itemsByFavorite as ALL_FAVORITES,
  itemImageUrl,
  type Item,
} from "../../data/loadGenerated";
import { SearchBar } from "../common/SearchBar";
import { FilterChip } from "../common/FilterChip";
import { CategoryBadge, categoryColor } from "../common/CategoryBadge";

const ALL_CATEGORIES = (() => {
  const seen = new Map<string, number>();
  for (const i of ALL_ITEMS) seen.set(i.category, (seen.get(i.category) ?? 0) + 1);
  return Array.from(seen.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
})();

const ALL_TAGS = (() => {
  const seen = new Map<string, number>();
  for (const i of ALL_ITEMS) {
    if (!i.tag) continue;
    seen.set(i.tag, (seen.get(i.tag) ?? 0) + 1);
  }
  // Drop the obvious data-entry typo from upstream.
  return Array.from(seen.entries())
    .filter(([, c]) => c >= 5)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
})();

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
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showAllFavorites, setShowAllFavorites] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_ITEMS.filter((i) => {
      if (categories.size > 0 && !categories.has(i.category)) return false;
      if (tags.size > 0 && !tags.has(i.tag)) return false;
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
  }, [query, categories, tags, favorites]);

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
          {(categories.size > 0 || tags.size > 0 || favorites.size > 0 || query) && (
            <button
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
              onClick={() => {
                setQuery("");
                setCategories(new Set());
                setTags(new Set());
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

        {ALL_TAGS.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              Tag
            </span>
            {ALL_TAGS.map((t) => (
              <FilterChip
                key={t}
                label={t}
                active={tags.has(t)}
                onClick={() => setTags((s) => toggle(s, t))}
              />
            ))}
          </div>
        )}

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

        <div className="text-[10px] text-[var(--color-muted)]">
          Item data and icons courtesy of{" "}
          <a
            href="https://www.serebii.net/pokemonpokopia/items.shtml"
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
              No items match these filters.
            </div>
          ) : (
            <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
              {filtered.map((i, idx) => (
                <ItemCard
                  key={`${i.category}-${i.name}-${idx}`}
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
  const img = itemImageUrl(item.image);
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
      <div className="flex items-start gap-2">
        {img ? (
          <img
            src={img}
            alt={item.name}
            className="h-12 w-12 shrink-0 rounded bg-[var(--color-panel-hi)] object-contain p-0.5"
            loading="lazy"
          />
        ) : (
          <div className="h-12 w-12 shrink-0 rounded bg-[var(--color-panel-hi)]" />
        )}
        <div className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm font-medium leading-tight">
            {item.name}
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <CategoryBadge category={item.category} />
            {item.tag && (
              <span className="rounded bg-[var(--color-panel-hi)] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[var(--color-muted)]">
                {item.tag}
              </span>
            )}
          </div>
        </div>
      </div>
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
  const img = itemImageUrl(item.image);
  return (
    <aside className="hidden w-[360px] shrink-0 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-panel)] p-4 lg:block">
      <div className="flex items-start gap-3">
        {img && (
          <img
            src={img}
            alt={item.name}
            className="h-20 w-20 shrink-0 rounded bg-[var(--color-panel-hi)] object-contain p-1"
          />
        )}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <CategoryBadge category={item.category} size="md" />
            {item.tag && (
              <span className="rounded bg-[var(--color-panel-hi)] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[var(--color-muted)]">
                {item.tag}
              </span>
            )}
          </div>
          <div className="mt-2 text-lg font-semibold leading-tight">{item.name}</div>
        </div>
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
