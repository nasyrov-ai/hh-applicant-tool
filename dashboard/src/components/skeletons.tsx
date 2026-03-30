/**
 * Shared skeleton components for loading states.
 * Keep visual output identical to the original inline skeletons.
 */

interface PageHeaderSkeletonProps {
  titleWidth?: string;
  descriptionWidth?: string;
}

export function PageHeaderSkeleton({
  titleWidth = "w-32",
  descriptionWidth = "w-48",
}: PageHeaderSkeletonProps) {
  return (
    <div className="space-y-2">
      <div className={`h-7 ${titleWidth} rounded bg-muted`} />
      <div className={`h-4 ${descriptionWidth} rounded bg-muted`} />
    </div>
  );
}

export function SearchBarSkeleton() {
  return <div className="h-10 w-full rounded-lg bg-muted" />;
}

interface TableSkeletonProps {
  rows?: number;
  columns: { width: string; rounded?: string }[];
}

export function TableSkeleton({ rows = 8, columns }: TableSkeletonProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-border/50 px-4 py-3 last:border-0"
        >
          {columns.map((col, j) => (
            <div
              key={j}
              className={`h-4 ${col.width} rounded${col.rounded ? ` ${col.rounded}` : ""} bg-muted`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface CardGridSkeletonProps {
  count?: number;
  cardHeight?: string;
  columns?: string;
}

export function CardGridSkeleton({
  count = 6,
  cardHeight = "h-24",
  columns = "grid gap-3",
}: CardGridSkeletonProps) {
  return (
    <div className={columns}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${cardHeight} rounded-xl border border-border bg-card`}
        />
      ))}
    </div>
  );
}

interface ListSkeletonProps {
  count?: number;
  itemHeight?: string;
}

export function ListSkeleton({ count = 8, itemHeight = "h-16" }: ListSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${itemHeight} animate-pulse rounded-xl bg-muted`} />
      ))}
    </div>
  );
}
