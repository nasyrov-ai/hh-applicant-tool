"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EXP_OPTIONS = [
  { value: "", label: "Любой опыт" },
  { value: "noExperience", label: "Без опыта" },
  { value: "between1And3", label: "1–3" },
  { value: "between3And6", label: "3–6" },
  { value: "moreThan6", label: "6+" },
];

export function VacanciesFilter({
  currentExp,
  currentRemote,
  currentSalaryMin,
}: {
  currentExp: string;
  currentRemote: string;
  currentSalaryMin: string;
}) {
  const router = useRouter();

  function navigate(overrides: Record<string, string>) {
    const p = new URLSearchParams({
      exp: currentExp,
      remote: currentRemote,
      salary_min: currentSalaryMin,
      ...overrides,
    });
    for (const [k, v] of p.entries()) {
      if (!v) p.delete(k);
    }
    router.push(`/vacancies?${p.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        {EXP_OPTIONS.map(({ value, label }) => (
          <Button
            key={value}
            variant={currentExp === value ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate({ exp: value })}
          >
            {label}
          </Button>
        ))}
      </div>

      <Button
        variant={currentRemote === "true" ? "default" : "ghost"}
        size="sm"
        onClick={() => navigate({ remote: currentRemote === "true" ? "" : "true" })}
        className={currentRemote === "true" ? "bg-success text-success-foreground hover:bg-success/90" : ""}
      >
        Remote
      </Button>

      <Input
        type="number"
        placeholder="Зарплата от..."
        defaultValue={currentSalaryMin}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            navigate({ salary_min: (e.target as HTMLInputElement).value });
          }
        }}
        className="h-8 w-40"
      />
    </div>
  );
}
