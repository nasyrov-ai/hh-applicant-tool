import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseHref: string;
  params?: Record<string, string>;
}

function getPageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];
  pages.push(1);

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  pages.push(total);

  return pages;
}

function buildHref(baseHref: string, page: number, params?: Record<string, string>): string {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        searchParams.set(key, value);
      }
    }
  }
  return `${baseHref}?${searchParams.toString()}`;
}

export function Pagination({ currentPage, totalPages, baseHref, params }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageWindow(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-center gap-1"
    >
      {currentPage > 1 ? (
        <Button variant="ghost" size="sm" asChild>
          <a href={buildHref(baseHref, currentPage - 1, params)}>&lsaquo;</a>
        </Button>
      ) : (
        <Button variant="ghost" size="sm" disabled>&lsaquo;</Button>
      )}

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="px-2 text-sm text-muted-foreground"
          >
            ...
          </span>
        ) : (
          <Button
            key={p}
            variant={p === currentPage ? "default" : "ghost"}
            size="sm"
            asChild
          >
            <a
              href={buildHref(baseHref, p, params)}
              aria-current={p === currentPage ? "page" : undefined}
            >
              {p}
            </a>
          </Button>
        )
      )}

      {currentPage < totalPages ? (
        <Button variant="ghost" size="sm" asChild>
          <a href={buildHref(baseHref, currentPage + 1, params)}>&rsaquo;</a>
        </Button>
      ) : (
        <Button variant="ghost" size="sm" disabled>&rsaquo;</Button>
      )}
    </nav>
  );
}
