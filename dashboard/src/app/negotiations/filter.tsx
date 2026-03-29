"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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

  function setFilter(state: string) {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (currentSearch) params.set("q", currentSearch);
    router.push(`/negotiations?${params.toString()}`);
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
    </div>
  );
}
