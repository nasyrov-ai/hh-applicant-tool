import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <div className="mb-6">
        <PageHeaderSkeleton descriptionWidth="w-64" />
      </div>
      <CardGridSkeleton
        count={6}
        cardHeight="h-48"
        columns="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      />
    </div>
  );
}
