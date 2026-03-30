import { PageHeaderSkeleton, SearchBarSkeleton, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <PageHeaderSkeleton />
      <SearchBarSkeleton />
      <TableSkeleton
        columns={[
          { width: "w-1/5" },
          { width: "w-1/6" },
          { width: "w-16", rounded: "rounded-full" },
          { width: "w-24" },
          { width: "w-24" },
          { width: "w-12" },
        ]}
      />
    </div>
  );
}
