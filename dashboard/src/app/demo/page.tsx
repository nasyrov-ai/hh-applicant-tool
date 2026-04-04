import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Send,
  UserCheck,
  XCircle,
  TrendingUp,
  Briefcase,
  Clock,
  Rocket,
} from "lucide-react";

export const metadata = { title: "Demo — 1.618 worksearch" };

const MOCK_KPI = {
  total: 847,
  invitations: 43,
  discards: 312,
  vacancies: 2_150,
  conversionRate: 5.1,
};

const MOCK_ACTIVITY = [
  { id: 1, vacancy: "Senior Frontend Developer", state: "invitation", time: "2 часа назад" },
  { id: 2, vacancy: "React Developer (удалёнка)", state: "response", time: "3 часа назад" },
  { id: 3, vacancy: "Fullstack Engineer", state: "discard", time: "5 часов назад" },
  { id: 4, vacancy: "Lead Frontend", state: "invitation", time: "6 часов назад" },
  { id: 5, vacancy: "TypeScript Developer", state: "response", time: "8 часов назад" },
  { id: 6, vacancy: "Frontend Architect", state: "response", time: "10 часов назад" },
];

const STATE_CONFIG: Record<string, { label: string; variant: "success" | "destructive" | "default" }> = {
  invitation: { label: "Приглашение", variant: "success" },
  discard: { label: "Отказ", variant: "destructive" },
  response: { label: "Отклик", variant: "default" },
};

export default function DemoPage() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Demo watermark */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
        <span className="rotate-[-30deg] text-[120px] font-black leading-none text-muted-foreground/[0.04] select-none">
          DEMO
        </span>
      </div>

      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-primary">1.618</span> worksearch
            <Badge variant="muted" className="ml-2 text-[10px]">DEMO</Badge>
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/pricing">Тарифы</a>
            </Button>
            <Button size="sm" asChild>
              <a href="/setup">
                <Rocket className="mr-1.5 h-3.5 w-3.5" />
                Начать бесплатно
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {/* KPI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Всего откликов"
            value={MOCK_KPI.total.toLocaleString("ru-RU")}
            icon={Send}
          />
          <KpiCard
            title="Приглашения"
            value={MOCK_KPI.invitations}
            subtitle={`${MOCK_KPI.conversionRate}% конверсия`}
            icon={UserCheck}
            trend="up"
          />
          <KpiCard
            title="Отказы"
            value={MOCK_KPI.discards}
            icon={XCircle}
          />
          <KpiCard
            title="Вакансий в базе"
            value={MOCK_KPI.vacancies.toLocaleString("ru-RU")}
            icon={Briefcase}
          />
        </div>

        {/* Chart placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Активность за 30 дней
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-end gap-1">
              {Array.from({ length: 30 }).map((_, i) => {
                const h = 20 + ((i * 37 + 13) % 60) + ((i * 7) % 20);
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-primary/20 transition-colors hover:bg-primary/40"
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Последняя активность
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_ACTIVITY.map((a) => {
                const cfg = STATE_CONFIG[a.state];
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      <span className="text-sm">{a.vacancy}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{a.time}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <h2 className="text-xl font-bold">Готовы автоматизировать поиск работы?</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Настройка займёт 5 минут. Бесплатный тариф — до 20 откликов в день.
            </p>
            <Button size="lg" asChild>
              <a href="/setup">
                <Rocket className="mr-2 h-4 w-4" />
                Начать бесплатно
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
