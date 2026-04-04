"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LayoutList, Kanban } from "lucide-react";

export function ViewToggle({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle(view: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "table") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
      <button
        onClick={() => toggle("table")}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
          current === "table"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <LayoutList className="h-3.5 w-3.5" />
        Таблица
      </button>
      <button
        onClick={() => toggle("kanban")}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
          current === "kanban"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <Kanban className="h-3.5 w-3.5" />
        Kanban
      </button>
    </div>
  );
}
