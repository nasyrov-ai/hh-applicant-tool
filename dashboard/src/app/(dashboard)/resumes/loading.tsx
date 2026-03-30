import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <PageHeaderSkeleton titleWidth="w-28" />
      <CardGridSkeleton
        count={3}
        cardHeight="h-40"
        columns="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      />
    </div>
  );
}
