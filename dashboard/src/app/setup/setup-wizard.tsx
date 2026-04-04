"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Database,
  Key,
  Sparkles,
  Rocket,
  Check,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";

const STEPS = [
  { icon: Database, label: "Supabase", title: "Подключение базы данных" },
  { icon: Key, label: "hh.ru", title: "Авторизация на hh.ru" },
  { icon: Sparkles, label: "AI", title: "Настройка AI-провайдера" },
  { icon: Rocket, label: "Запуск", title: "Первый запуск" },
];

export function SetupWizard() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    supabaseUrl: "",
    supabaseKey: "",
    aiProvider: "claude" as "claude" | "openai",
    openaiKey: "",
  });

  const canNext =
    step === 0
      ? config.supabaseUrl.startsWith("https://") && config.supabaseKey.length > 10
      : step === 1
        ? true // instructions step, always can proceed
        : step === 2
          ? config.aiProvider === "claude" || config.openaiKey.length > 10
          : true;

  return (
    <div>
      {/* Progress */}
      <div className="mb-6 flex items-center justify-between">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <div key={s.label} className="flex flex-1 items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 transition-colors ${
                    done ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{STEPS[step].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                Создайте проект на{" "}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  supabase.com <ExternalLink className="mb-0.5 inline h-3 w-3" />
                </a>{" "}
                и скопируйте URL и anon key из Settings → API.
              </p>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Supabase URL
                </label>
                <Input
                  value={config.supabaseUrl}
                  onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
                  placeholder="https://xxxxx.supabase.co"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Anon Key
                </label>
                <Input
                  value={config.supabaseKey}
                  onChange={(e) => setConfig({ ...config, supabaseKey: e.target.value })}
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                  type="password"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-muted-foreground">
                Авторизуйтесь в hh.ru через CLI-инструмент:
              </p>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <code className="text-sm">
                  pip install hh-applicant-tool
                  <br />
                  hh-applicant-tool authorize
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                Команда откроет браузер для OAuth авторизации. После
                подтверждения токен сохранится автоматически.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">
                Выберите AI-провайдер для сопроводительных писем:
              </p>
              <div className="flex gap-2">
                <Button
                  variant={config.aiProvider === "claude" ? "default" : "outline"}
                  onClick={() => setConfig({ ...config, aiProvider: "claude" })}
                  className="flex-1"
                >
                  Claude (бесплатно)
                </Button>
                <Button
                  variant={config.aiProvider === "openai" ? "default" : "outline"}
                  onClick={() => setConfig({ ...config, aiProvider: "openai" })}
                  className="flex-1"
                >
                  OpenAI
                </Button>
              </div>
              {config.aiProvider === "openai" && (
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    OpenAI API Key
                  </label>
                  <Input
                    value={config.openaiKey}
                    onChange={(e) => setConfig({ ...config, openaiKey: e.target.value })}
                    placeholder="sk-..."
                    type="password"
                  />
                </div>
              )}
              {config.aiProvider === "claude" && (
                <p className="text-xs text-muted-foreground">
                  Claude работает через Claude Code CLI — API-ключ не нужен.
                </p>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-3">
                  <Check className="h-5 w-5 text-success" />
                  <span className="text-sm">База данных подключена</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-3">
                  <Check className="h-5 w-5 text-success" />
                  <span className="text-sm">hh.ru авторизован</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-3">
                  <Check className="h-5 w-5 text-success" />
                  <span className="text-sm">
                    AI: {config.aiProvider === "claude" ? "Claude" : "OpenAI"}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Всё готово! Запустите worker командой:
              </p>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <code className="text-sm">npm run dev</code>
              </div>
              <Button className="w-full" asChild>
                <Link href="/">Открыть дашборд</Link>
              </Button>
            </>
          )}

          {/* Navigation */}
          {step < 3 && (
            <div className="flex justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                disabled={step === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Назад
              </Button>
              <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
                Далее
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
