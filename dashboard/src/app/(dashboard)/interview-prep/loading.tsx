export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-52 rounded bg-muted" />
        <div className="h-4 w-72 rounded bg-muted" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-48 rounded-xl border border-border bg-card" />
      ))}
    </div>
  );
}
