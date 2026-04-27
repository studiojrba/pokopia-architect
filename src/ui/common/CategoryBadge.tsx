function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function categoryColor(category: string): string {
  const hue = hash(category) % 360;
  return `hsl(${hue}, 60%, 55%)`;
}

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "sm" }: CategoryBadgeProps) {
  const color = categoryColor(category);
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full border " +
        (size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs")
      }
      style={{
        borderColor: color + "66",
        backgroundColor: color + "1f",
        color: color,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {category}
    </span>
  );
}
