"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveSettings } from "./actions";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsFormProps {
  initial: Record<string, unknown>;
}

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "tags";
  placeholder?: string;
  options?: { value: string; label: string }[];
  description?: string;
}

interface SectionDef {
  title: string;
  fields: FieldDef[];
}

const SECTIONS: SectionDef[] = [
  {
    title: "AI",
    fields: [
      {
        key: "ai_provider",
        label: "Провайдер",
        type: "select",
        options: [
          { value: "claude", label: "Claude (CLI)" },
          { value: "openai", label: "OpenAI" },
        ],
        description: "Какой AI использовать для генерации текстов",
      },
      { key: "openai_model", label: "Модель OpenAI", type: "text", placeholder: "gpt-4o" },
      { key: "openai_temperature", label: "Temperature", type: "number", placeholder: "0.7" },
      { key: "claude_model", label: "Модель Claude", type: "text", placeholder: "claude-opus-4-6" },
    ],
  },
  {
    title: "Промпты",
    fields: [
      {
        key: "cover_letter_system_prompt",
        label: "System prompt (отклики)",
        type: "textarea",
        placeholder: "Ты — соискатель...",
        description: "Системный промпт для генерации сопроводительных писем",
      },
      {
        key: "cover_letter_prompt",
        label: "Промпт (отклики)",
        type: "textarea",
        placeholder: "Сгенерируй сопроводительное письмо...",
      },
      {
        key: "chat_system_prompt",
        label: "System prompt (чаты)",
        type: "textarea",
        placeholder: "Ты — соискатель на HeadHunter...",
      },
      {
        key: "chat_prompt",
        label: "Промпт (чаты)",
        type: "textarea",
        placeholder: "Напиши короткий ответ работодателю...",
      },
    ],
  },
  {
    title: "Поиск вакансий",
    fields: [
      {
        key: "search_queries",
        label: "Поисковые запросы",
        type: "tags",
        placeholder: "AI интегратор, автоматизация...",
        description: "Через запятую. Каждый запрос используется отдельно",
      },
      {
        key: "excluded_filter",
        label: "Исключающий фильтр (regex)",
        type: "text",
        placeholder: "junior|стажир|bitrix...",
        description: "Регулярное выражение для исключения вакансий",
      },
      { key: "salary_min", label: "Минимальная зарплата", type: "number", placeholder: "100000" },
      { key: "total_pages", label: "Страниц поиска", type: "number", placeholder: "5" },
      { key: "period", label: "Период (дни)", type: "number", placeholder: "30" },
    ],
  },
  {
    title: "Общие",
    fields: [
      { key: "api_delay", label: "Задержка API (сек)", type: "number", placeholder: "1" },
      { key: "reply_period", label: "Период ответов (дни)", type: "number", placeholder: "30" },
    ],
  },
];

export function SettingsForm({ initial }: SettingsFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [saving, startSave] = useTransition();

  function updateValue(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startSave(async () => {
      const entries = Object.entries(values).map(([key, value]) => ({
        key,
        value,
      }));
      await saveSettings(entries);
      toast.success("Настройки сохранены");
    });
  }

  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="text-sm">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.fields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={values[field.key]}
                onChange={(v) => updateValue(field.key, v)}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="sticky bottom-4 flex items-center justify-end gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Сохранить
        </Button>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">
        {field.label}
      </label>
      {field.description && (
        <p className="mb-1 text-xs text-muted-foreground/70">{field.description}</p>
      )}

      {field.type === "textarea" ? (
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={field.placeholder}
          rows={3}
          className="resize-y"
        />
      ) : field.type === "select" ? (
        <Select
          value={(value as string) ?? ""}
          onValueChange={(v) => onChange(v || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Не выбрано" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === "tags" ? (
        <Input
          type="text"
          value={Array.isArray(value) ? (value as string[]).join(", ") : (value as string) ?? ""}
          onChange={(e) => {
            const tags = e.target.value
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
            onChange(tags.length > 0 ? tags : null);
          }}
          placeholder={field.placeholder}
        />
      ) : field.type === "number" ? (
        <Input
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) =>
            onChange(e.target.value ? parseFloat(e.target.value) : null)
          }
          placeholder={field.placeholder}
        />
      ) : (
        <Input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={field.placeholder}
        />
      )}
    </div>
  );
}
