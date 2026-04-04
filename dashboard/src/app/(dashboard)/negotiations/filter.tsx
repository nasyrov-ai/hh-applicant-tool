"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { clearDiscardedNegotiations } from "./actions";

const FILTERS = [
  { value: "", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "invitation", label: "Приглашения" },
  { value: "discard", label: "Отказы" },
];

export function NegotiationsFilter({
  currentState,
  currentSearch,
}: {
  currentState: string;
  currentSearch: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setFilter(state: string) {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (currentSearch) params.set("q", currentSearch);
    router.push(`/negotiations?${params.toString()}`);
  }

  function handleClearDiscards() {
    if (!confirm("Удалить все отказы? Это действие необратимо.")) return;
    startTransition(async () => {
      try {
        await clearDiscardedNegotiations();
        router.refresh();
      } catch (e) {
        alert(`Ошибка: ${e instanceof Error ? e.message : "Неизвестная ошибка"}`);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {FILTERS.map(({ value, label }) => (
        <Button
          key={value}
          variant={currentState === value ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter(value)}
        >
          {label}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClearDiscards}
        disabled={isPending}
        className="ml-2 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {isPending ? "Удаление..." : "Очистить отказы"}
      </Button>
    </div>
  );
}
