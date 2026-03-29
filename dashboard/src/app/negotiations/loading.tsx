export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded bg-muted" />
        <div className="h-4 w-48 rounded bg-muted" />
      </div>
      <div className="h-10 w-full rounded-lg bg-muted" />
      <div className="rounded-xl border border-border bg-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border/50 px-4 py-3 last:border-0"
          >
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-4 w-1/5 rounded bg-muted" />
            <div className="h-5 w-16 rounded-full bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
