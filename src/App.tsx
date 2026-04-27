import { useState } from "react";
import { WorldTab } from "./ui/tabs/WorldTab";
import { PokemonTab } from "./ui/tabs/PokemonTab";
import { HabitatsTab } from "./ui/tabs/HabitatsTab";
import { HousesTab } from "./ui/tabs/HousesTab";
import { ItemsTab } from "./ui/tabs/ItemsTab";

type TabId = "world" | "pokemon" | "habitats" | "houses" | "items";

const TABS: { id: TabId; label: string }[] = [
  { id: "world", label: "World" },
  { id: "pokemon", label: "Pokemon" },
  { id: "habitats", label: "Habitats" },
  { id: "houses", label: "Houses" },
  { id: "items", label: "Items" },
];

function App() {
  const [tab, setTab] = useState<TabId>("world");

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight">
            The Pokopia Architect
          </span>
          <span className="text-xs text-[var(--color-muted)]">
            3D Build &amp; Habitat Planner
          </span>
        </div>
        <nav className="ml-6 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "rounded px-3 py-1 text-sm transition-colors " +
                (tab === t.id
                  ? "bg-[var(--color-accent)] text-black"
                  : "text-[var(--color-text)] hover:bg-[var(--color-panel-hi)]")
              }
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto text-xs text-[var(--color-muted)]">
          Local-only • No account required
        </div>
      </header>
      <main className="relative flex-1 overflow-hidden">
        {tab === "world" && <WorldTab />}
        {tab === "pokemon" && <PokemonTab />}
        {tab === "habitats" && <HabitatsTab />}
        {tab === "houses" && <HousesTab />}
        {tab === "items" && <ItemsTab />}
      </main>
    </div>
  );
}

export default App;
