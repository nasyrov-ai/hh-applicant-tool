"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { CommandStatus } from "./command-status";
import { executeCommand, getActiveCommands } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  MessagesSquare,
  RefreshCw,
  Trash2,
  Database,
  Key,
  Loader2,
} from "lucide-react";

interface OperationDef {
  command: string;
  label: string;
  description: string;
  icon: typeof Send;
  args?: Record<string, unknown>;
  fields?: FieldDef[];
}

interface FieldDef {
  name: string;
  label: string;
  type: "text" | "number" | "boolean";
  placeholder?: string;
  defaultValue?: string | number | boolean;
}

const OPERATIONS: OperationDef[] = [
  {
    command: "apply-vacancies",
    label: "Рассылка откликов",
    description: "Поиск и отклик на подходящие вакансии с AI-генерацией писем",
    icon: Send,
    fields: [
      { name: "search", label: "Поиск", type: "text", placeholder: "AI интегратор" },
      { name: "total-pages", label: "Страниц", type: "number", defaultValue: 5 },
      { name: "use-ai", label: "AI письма", type: "boolean", defaultValue: true },
    ],
  },
  {
    command: "reply-employers",
    label: "Ответить работодателям",
    description: "AI-ответы на сообщения от работодателей в чатах",
    icon: MessagesSquare,
    fields: [
      { name: "period", label: "За дней", type: "number", defaultValue: 30 },
      { name: "use-ai", label: "AI ответы", type: "boolean", defaultValue: true },
    ],
  },
  {
    command: "update-resumes",
    label: "Обновить резюме",
    description: "Поднять резюме в поиске рекрутеров",
    icon: RefreshCw,
  },
  {
    command: "clear-negotiations",
    label: "Очистить отказы",
    description: "Удалить отклики с отказами и заблокировать ATS",
    icon: Trash2,
    fields: [
      { name: "delete-chat", label: "Удалить чаты", type: "boolean", defaultValue: true },
      { name: "blacklist-discard", label: "Блокировать за отказ", type: "boolean", defaultValue: false },
      { name: "block-ats", label: "Блокировать ATS", type: "boolean", defaultValue: true },
    ],
  },
  {
    command: "sync-db",
    label: "Синхронизация БД",
    description: "Выгрузить данные из SQLite в Supabase",
    icon: Database,
    args: { full: true },
  },
  {
    command: "refresh-token",
    label: "Обновить токен",
    description: "Обновить OAuth токен HH.ru",
    icon: Key,
  },
];

export default function OperationsPage() {
  const [runningCommands, setRunningCommands] = useState<
    Record<string, string>
  >({});
  const [loadingCommand, setLoadingCommand] = useState<string | null>(null);

  // Load active commands on mount (survives page reload)
  useEffect(() => {
    getActiveCommands().then((active) => {
      const map: Record<string, string> = {};
      for (const cmd of active) {
        map[cmd.command] = cmd.id;
      }
      setRunningCommands((prev) => ({ ...map, ...prev }));
    });
  }, []);

  async function handleRun(op: OperationDef, formArgs: Record<string, unknown>) {
    setLoadingCommand(op.command);
    try {
      const mergedArgs = { ...(op.args || {}), ...formArgs };
      const result = await executeCommand(op.command, mergedArgs);
      setRunningCommands((prev) => ({ ...prev, [op.command]: result.id }));
      toast.success("Команда отправлена", { description: op.label });
    } catch (err) {
      console.error(err);
      toast.error("Не удалось запустить команду");
    } finally {
      setLoadingCommand(null);
    }
  }

  function handleComplete(command: string) {
    // Keep showing status for 5 seconds after completion
    setTimeout(() => {
      setRunningCommands((prev) => {
        const next = { ...prev };
        delete next[command];
        return next;
      });
    }, 5000);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Операции"
        description="Запуск команд на сервере"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
        {OPERATIONS.map((op) => (
          <OperationCard
            key={op.command}
            op={op}
            isLoading={loadingCommand === op.command}
            runningCommandId={runningCommands[op.command]}
            onRun={(args) => handleRun(op, args)}
            onComplete={() => handleComplete(op.command)}
          />
        ))}
      </div>
    </div>
  );
}

function OperationCard({
  op,
  isLoading,
  runningCommandId,
  onRun,
  onComplete,
}: {
  op: OperationDef;
  isLoading: boolean;
  runningCommandId?: string;
  onRun: (args: Record<string, unknown>) => void;
  onComplete: () => void;
}) {
  const [formState, setFormState] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    op.fields?.forEach((f) => {
      if (f.defaultValue !== undefined) initial[f.name] = f.defaultValue;
    });
    return initial;
  });

  const Icon = op.icon;

  return (
    <Card className="group transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
            <Icon className="h-4.5 w-4.5 text-primary transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div>
            <h3 className="text-sm font-medium">{op.label}</h3>
            <p className="text-xs text-muted-foreground">{op.description}</p>
          </div>
        </div>

        {/* Fields */}
        {op.fields && (
          <div className="mt-4 space-y-2">
            {op.fields.map((field) => (
              <div key={field.name} className="flex items-center gap-2">
                <label className="w-28 shrink-0 text-xs text-muted-foreground">
                  {field.label}
                </label>
                {field.type === "boolean" ? (
                  <Button
                    type="button"
                    variant={formState[field.name] ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setFormState((s) => ({
                        ...s,
                        [field.name]: !s[field.name],
                      }))
                    }
                  >
                    {formState[field.name] ? "Да" : "Нет"}
                  </Button>
                ) : (
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(formState[field.name] as string | number) ?? ""}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        [field.name]:
                          field.type === "number"
                            ? e.target.value
                              ? parseInt(e.target.value, 10)
                              : undefined
                            : e.target.value || undefined,
                      }))
                    }
                    className="h-7 text-xs flex-1"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Status or Run button */}
        <div className="mt-4">
          {runningCommandId ? (
            <CommandStatus
              commandId={runningCommandId}
              onComplete={onComplete}
            />
          ) : (
            <Button
              type="button"
              disabled={isLoading}
              onClick={() => onRun(formState)}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Запустить"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
