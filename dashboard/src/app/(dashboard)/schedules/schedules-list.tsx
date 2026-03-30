"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createSchedule, toggleSchedule, deleteSchedule } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { Plus, Trash2, Loader2, CalendarClock } from "lucide-react";

const COMMANDS = [
  { value: "apply-vacancies", label: "Рассылка откликов" },
  { value: "reply-employers", label: "Ответить работодателям" },
  { value: "update-resumes", label: "Обновить резюме" },
  { value: "clear-negotiations", label: "Очистить отказы" },
  { value: "sync-db", label: "Синхронизация БД" },
  { value: "refresh-token", label: "Обновить токен" },
];

const CRON_PRESETS = [
  { label: "Каждый час (9-21)", value: "0 9-21 * * *" },
  { label: "Каждые 3 часа", value: "0 */3 * * *" },
  { label: "Каждый день в 9:00", value: "0 9 * * *" },
  { label: "Каждый день в 21:00", value: "0 21 * * *" },
  { label: "Каждые 5 часов", value: "0 */5 * * *" },
  { label: "Каждые 30 минут", value: "*/30 * * * *" },
];

interface Schedule {
  id: string;
  name: string;
  command: string;
  args: Record<string, unknown>;
  cron_expression: string;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
}

export function SchedulesList({ schedules }: { schedules: Schedule[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [toggling, startToggle] = useTransition();
  const [deleting, startDelete] = useTransition();

  function handleToggle(id: string, enabled: boolean) {
    startToggle(async () => {
      try {
        await toggleSchedule(id, enabled);
        toast.success(enabled ? "Расписание включено" : "Расписание отключено");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось изменить расписание");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Удалить это расписание?")) return;
    startDelete(async () => {
      try {
        await deleteSchedule(id);
        toast.success("Расписание удалено");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось удалить расписание");
      }
    });
  }

  return (
    <div>
      {!showCreate && (
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Новое расписание
        </Button>
      )}

      {showCreate && (
        <CreateScheduleForm onClose={() => setShowCreate(false)} />
      )}

      <div className="mt-4 space-y-2">
        {schedules.length === 0 && (
          <EmptyState icon={CalendarClock} title="Нет расписаний" />
        )}
        {schedules.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Toggle */}
                <button
                  disabled={toggling}
                  onClick={() => handleToggle(s.id, !s.enabled)}
                  className={`h-5 w-9 rounded-full transition-colors ${
                    s.enabled ? "bg-success" : "bg-muted"
                  }`}
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                      s.enabled ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{s.name}</p>
                    <Badge variant={s.enabled ? "success" : "muted"}>
                      {COMMANDS.find((c) => c.value === s.command)?.label || s.command}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" />
                      {s.cron_expression}
                    </span>
                    {s.last_run_at && (
                      <span>Последний: {formatDateTime(s.last_run_at)}</span>
                    )}
                    {s.next_run_at && (
                      <span>Следующий: {formatDateTime(s.next_run_at)}</span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                disabled={deleting}
                onClick={() => handleDelete(s.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateScheduleForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [command, setCommand] = useState("apply-vacancies");
  const [cron, setCron] = useState("0 9-21 * * *");
  const [creating, startCreate] = useTransition();

  function handleSubmit() {
    if (!name.trim()) return;
    startCreate(async () => {
      await createSchedule({
        name: name.trim(),
        command,
        args: {},
        cron_expression: cron,
      });
      toast.success("Расписание создано");
      onClose();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Название</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ежедневные отклики"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Команда</label>
          <Select value={command} onValueChange={setCommand}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMMANDS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Cron выражение</label>
          <Input
            type="text"
            value={cron}
            onChange={(e) => setCron(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-1">
            {CRON_PRESETS.map((p) => (
              <Button
                key={p.value}
                type="button"
                variant={cron === p.value ? "default" : "outline"}
                size="sm"
                onClick={() => setCron(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={creating || !name.trim()}
          >
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            Создать
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
