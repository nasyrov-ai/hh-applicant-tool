import { PageHeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <PageHeaderSkeleton titleWidth="w-40" descriptionWidth="w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-border bg-card" />
      <div className="h-80 rounded-xl border border-border bg-card" />
    </div>
  );
}
