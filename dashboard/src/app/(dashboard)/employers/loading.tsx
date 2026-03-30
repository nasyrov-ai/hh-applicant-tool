import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <PageHeaderSkeleton titleWidth="w-40" />
      <CardGridSkeleton />
    </div>
  );
}
