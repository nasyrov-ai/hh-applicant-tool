export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded bg-muted" />
        <div className="h-4 w-48 rounded bg-muted" />
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
