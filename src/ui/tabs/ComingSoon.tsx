interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-6">
        <div className="mb-2 text-xs uppercase tracking-wider text-[var(--color-muted)]">
          Coming soon
        </div>
        <h2 className="mb-3 text-xl font-semibold">{title}</h2>
        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}
