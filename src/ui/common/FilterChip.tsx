import type { ReactNode } from "react";

interface FilterChipProps {
  label: ReactNode;
  active: boolean;
  onClick: () => void;
  count?: number;
  accent?: string;
  title?: string;
}

export function FilterChip({
  label,
  active,
  onClick,
  count,
  accent,
  title,
}: FilterChipProps) {
  const style = active && accent ? { backgroundColor: accent } : undefined;
  return (
    <button
      onClick={onClick}
      title={title}
      style={style}
      className={
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors " +
        (active
          ? accent
            ? "border-transparent text-black"
            : "border-[var(--color-accent)] bg-[var(--color-accent)] text-black"
          : "border-[var(--color-border)] bg-[var(--color-panel-hi)] text-[var(--color-text)] hover:border-[var(--color-accent)]")
      }
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={
            "rounded-full px-1.5 text-[10px] " +
            (active ? "bg-black/20 text-black/70" : "bg-black/30 text-[var(--color-muted)]")
          }
        >
          {count}
        </span>
      )}
    </button>
  );
}
