/**
 * Full block palette overlay — opened with B key or the palette button.
 * Shows all blocks grouped by kind. Click to select and close.
 */
import { BLOCKS_BY_KIND, KIND_LABELS, type BlockKind } from "../../data/blocks";
import { useEditorStore } from "../../editor/store";

const KIND_ORDER: BlockKind[] = [
  "wall",
  "floor",
  "roof",
  "door",
  "window",
  "furniture",
  "habitat",
  "natural",
];

export function BlockPalette({ onClose }: { onClose: () => void }) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const setHotbarBlock = useEditorStore((s) => s.setHotbarBlock);
  const hotbarSlot = useEditorStore((s) => s.hotbarSlot);

  const select = (blockId: string) => {
    setHotbarBlock(hotbarSlot, blockId);
    onClose();
  };

  return (
    /* Backdrop */
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative w-[680px] max-h-[80vh] overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Block Palette</h2>
          <span className="text-xs text-[var(--color-muted)]">
            Click to set current slot · press <kbd className="rounded bg-[var(--color-panel-hi)] px-1">B</kbd> or <kbd className="rounded bg-[var(--color-panel-hi)] px-1">Esc</kbd> to close
          </span>
        </div>

        <div className="space-y-5">
          {KIND_ORDER.map((kind) => {
            const kindBlocks = BLOCKS_BY_KIND.get(kind) ?? [];
            if (!kindBlocks.length) return null;
            return (
              <div key={kind}>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                  {KIND_LABELS[kind]}
                </div>
                <div className="flex flex-wrap gap-2">
                  {kindBlocks.map((b) => (
                    <button
                      key={b.id}
                      title={b.name}
                      onClick={() => select(b.id)}
                      className={
                        "flex flex-col items-center gap-1 rounded p-2 transition-colors " +
                        (selectedBlockId === b.id
                          ? "ring-2 ring-[var(--color-accent)] bg-[var(--color-panel-hi)]"
                          : "hover:bg-[var(--color-panel-hi)]")
                      }
                    >
                      {/* Color swatch */}
                      <div
                        className="h-10 w-10 rounded shadow-sm"
                        style={{ background: b.color }}
                      />
                      <span className="max-w-[56px] text-center text-[9px] leading-tight text-[var(--color-text)]">
                        {b.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
