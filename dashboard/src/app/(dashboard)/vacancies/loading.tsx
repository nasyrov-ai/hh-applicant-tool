import { PageHeaderSkeleton, SearchBarSkeleton, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <PageHeaderSkeleton />
      <SearchBarSkeleton />
      <TableSkeleton
        columns={[
          { width: "w-1/4" },
          { width: "w-20" },
          { width: "w-28" },
          { width: "w-16", rounded: "rounded-full" },
          { width: "w-20" },
          { width: "w-4" },
        ]}
      />
    </div>
  );
}
