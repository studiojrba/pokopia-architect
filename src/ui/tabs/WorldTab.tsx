import { useEffect } from "react";
import { Scene } from "../../scene/Scene";
import { Hotbar } from "../panels/Hotbar";
import { BlockPalette } from "../panels/BlockPalette";
import { useEditorStore, type ToolMode, type CameraMode } from "../../editor/store";
import { REGION_LIST } from "../../data/regions";

const TOOL_ICONS: Record<ToolMode, string> = {
  build: "🧱",
  erase: "🗑",
  pan: "✋",
};
const TOOL_LABELS: Record<ToolMode, string> = {
  build: "Build",
  erase: "Erase",
  pan: "Pan",
};
const CAMERA_LABELS: Record<CameraMode, string> = {
  orbit: "Orbit",
  topDown: "Top-down",
};

export function WorldTab() {
  const toolMode = useEditorStore((s) => s.toolMode);
  const setToolMode = useEditorStore((s) => s.setToolMode);
  const cameraMode = useEditorStore((s) => s.cameraMode);
  const setCameraMode = useEditorStore((s) => s.setCameraMode);
  const region = useEditorStore((s) => s.region);
  const setRegion = useEditorStore((s) => s.setRegion);
  const showPalette = useEditorStore((s) => s.showPalette);
  const togglePalette = useEditorStore((s) => s.togglePalette);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const clearAll = useEditorStore((s) => s.clearAll);
  const blockCount = useEditorStore((s) => s.blocks.size);
  const canUndo = useEditorStore((s) => s.undoStack.length > 0);
  const canRedo = useEditorStore((s) => s.redoStack.length > 0);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === "b" || e.key === "B") {
        togglePalette();
        return;
      }
      if (e.key === "Escape" && showPalette) {
        togglePalette();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        // Cycle tool modes
        const modes: ToolMode[] = ["build", "erase", "pan"];
        const idx = modes.indexOf(toolMode);
        setToolMode(modes[(idx + 1) % modes.length]);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toolMode, showPalette, undo, redo, togglePalette, setToolMode]);

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Toolbar */}
      <div className="relative z-20 flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-panel)]/95 px-3 py-1.5 backdrop-blur-sm">
        {/* Region selector */}
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as typeof region)}
          className="rounded border border-[var(--color-border)] bg-[var(--color-panel-hi)] px-2 py-1 text-xs"
        >
          {REGION_LIST.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <div className="h-4 w-px bg-[var(--color-border)]" />

        {/* Tool buttons */}
        {(["build", "erase", "pan"] as ToolMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setToolMode(m)}
            title={`${TOOL_LABELS[m]} (Tab to cycle)`}
            className={
              "rounded px-2.5 py-1 text-xs transition-colors " +
              (toolMode === m
                ? "bg-[var(--color-accent)] text-black"
                : "text-[var(--color-text)] hover:bg-[var(--color-panel-hi)]")
            }
          >
            {TOOL_ICONS[m]} {TOOL_LABELS[m]}
          </button>
        ))}

        <div className="h-4 w-px bg-[var(--color-border)]" />

        {/* Camera toggle */}
        <button
          onClick={() =>
            setCameraMode(cameraMode === "orbit" ? "topDown" : "orbit")
          }
          title="Toggle camera mode"
          className="rounded px-2.5 py-1 text-xs hover:bg-[var(--color-panel-hi)]"
        >
          📷 {CAMERA_LABELS[cameraMode]}
        </button>

        <div className="h-4 w-px bg-[var(--color-border)]" />

        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (⌘Z)"
          className="rounded px-2 py-1 text-xs hover:bg-[var(--color-panel-hi)] disabled:opacity-30"
        >
          ↩ Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (⌘⇧Z)"
          className="rounded px-2 py-1 text-xs hover:bg-[var(--color-panel-hi)] disabled:opacity-30"
        >
          ↪ Redo
        </button>

        <div className="h-4 w-px bg-[var(--color-border)]" />

        {/* Palette shortcut */}
        <button
          onClick={togglePalette}
          title="Open block palette (B)"
          className={
            "rounded px-2.5 py-1 text-xs transition-colors " +
            (showPalette
              ? "bg-[var(--color-accent)] text-black"
              : "hover:bg-[var(--color-panel-hi)]")
          }
        >
          🎨 Palette
        </button>

        <div className="ml-auto flex items-center gap-2">
          {/* Block count */}
          <span className="text-[10px] text-[var(--color-muted)]">
            {blockCount} block{blockCount !== 1 ? "s" : ""}
          </span>

          {/* Clear button */}
          {blockCount > 0 && (
            <button
              onClick={() => {
                if (confirm("Clear all blocks?")) clearAll();
              }}
              className="rounded px-2 py-1 text-[10px] text-[var(--color-muted)] hover:bg-red-900/40 hover:text-red-400"
            >
              Clear
            </button>
          )}
        </div>

        {/* Keyboard hint */}
        <span className="ml-2 hidden text-[9px] text-[var(--color-muted)] xl:block">
          Left-click: place · Right-click: erase · Tab: cycle tool · 1-9: hotbar · B: palette · ⌘Z: undo
        </span>
      </div>

      {/* 3D canvas */}
      <div className="relative flex-1">
        <Scene />
        {/* Hotbar — centered at bottom */}
        <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center">
          <Hotbar onOpenPalette={togglePalette} />
        </div>
        {/* Block Palette overlay */}
        {showPalette && <BlockPalette onClose={togglePalette} />}
      </div>
    </div>
  );
}
