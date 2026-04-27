/**
 * 9-slot hotbar displayed at the bottom of the World view.
 * Keys 1-9 switch slots; clicking a slot also selects it.
 */
import { useEffect } from "react";
import { useEditorStore } from "../../editor/store";
import { BLOCK_MAP } from "../../data/blocks";

export function Hotbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const hotbar = useEditorStore((s) => s.hotbar);
  const hotbarSlot = useEditorStore((s) => s.hotbarSlot);
  const setHotbarSlot = useEditorStore((s) => s.setHotbarSlot);

  // Number-key shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target !== document.body && (e.target as HTMLElement).tagName !== "CANVAS") return;
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9) setHotbarSlot(n - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setHotbarSlot]);

  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)]/90 px-3 py-2 shadow-lg backdrop-blur-sm">
      {hotbar.map((blockId, i) => {
        const def = BLOCK_MAP.get(blockId);
        const active = i === hotbarSlot;
        return (
          <button
            key={i}
            onClick={() => setHotbarSlot(i)}
            onDoubleClick={onOpenPalette}
            title={`[${i + 1}] ${def?.name ?? blockId} · double-click to change`}
            className={
              "relative flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded border transition-all " +
              (active
                ? "border-[var(--color-accent)] scale-110 shadow-md"
                : "border-[var(--color-border)] hover:border-[var(--color-accent)]/60")
            }
          >
            {/* Slot number */}
            <span className="absolute left-1 top-0.5 text-[9px] text-[var(--color-muted)]">
              {i + 1}
            </span>
            {/* Color swatch */}
            <div
              className="h-6 w-6 rounded-sm shadow-sm"
              style={{ background: def?.color ?? "#888" }}
            />
          </button>
        );
      })}
    </div>
  );
}
