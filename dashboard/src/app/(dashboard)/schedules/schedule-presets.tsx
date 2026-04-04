"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { applySchedulePreset } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Coffee, Moon, Loader2 } from "lucide-react";

const PRESETS = [
  {
    id: "active",
    label: "Активный поиск",
    description: "Отклики 3×/день, sync каждый час, горячие каждые 3ч",
    icon: Zap,
  },
  {
    id: "passive",
    label: "Пассивный",
    description: "Отклики 1×/день, ответы 1×/день, sync 2×/день",
    icon: Coffee,
  },
  {
    id: "weekend",
    label: "Выходной",
    description: "Только ответы 1×/день, sync 1×/день",
    icon: Moon,
  },
] as const;

export function SchedulePresets() {
  const [applying, startApply] = useTransition();

  function handleApply(presetId: string) {
    if (!confirm("Все те��ущие расписания будут заменены. Продолжить?")) return;
    startApply(async () => {
      try {
        await applySchedulePreset(presetId);
        toast.success("Шаблон расписания применён");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка применения шаблона");
      }
    });
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Быстрые шаблоны
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const Icon = p.icon;
            return (
              <Button
                key={p.id}
                variant="outline"
                size="sm"
                disabled={applying}
                onClick={() => handleApply(p.id)}
                className="gap-2"
                title={p.description}
              >
                {applying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                {p.label}
              </Button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Шаблон заменит все текущие расписания
        </p>
      </CardContent>
    </Card>
  );
}
