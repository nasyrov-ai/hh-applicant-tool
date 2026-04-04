import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  ArrowUpDown,
  Briefcase,
  Wifi,
  Star,
  Eye,
} from "lucide-react";
import { getMarketData, type Period } from "./queries";
import dynamic from "next/dynamic";

const HorizontalBarChart = dynamic(
  () => import("@/components/bar-chart").then((m) => m.HorizontalBarChart),
  { loading: () => <div className="h-[240px] animate-pulse rounded-xl bg-muted/50" /> },
);

const OverviewChart = dynamic(
  () => import("../overview-chart").then((m) => m.OverviewChart),
  { loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-muted/50" /> },
);

const PeriodSelector = dynamic(
  () => import("../analytics/period-selector").then((m) => m.PeriodSelector),
);

export const metadata = { title: "Рынок — 1.618 worksearch" };
export const revalidate = 60;

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const validPeriods = ["7d", "30d", "90d", "all"] as const;
  const period = (validPeriods as readonly string[]).includes(params.period ?? "")
    ? (params.period as Period)
    : "30d";
  const data = await getMarketData(period);

  // Transform trend for OverviewChart (expects {date, count})
  const trendForChart = data.trend.map((t) => ({
    date: new Date(t.date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
    count: Math.round(t.avg / 1000), // display in thousands
  }));

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Рынок"
          description="Аналитика зарплат и мониторинг работодателей"
        />
        <PeriodSelector current={period} />
      </div>

      {/* KPI row */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Средняя зарплата"
          value={data.stats.count > 0 ? `${formatNumber(data.stats.avg)} ₽` : "—"}
          subtitle={`${formatNumber(data.stats.count)} вакансий с зарплатой`}
          icon={DollarSign}
        />
        <KpiCard
          title="Медиана"
          value={data.stats.median > 0 ? `${formatNumber(data.stats.median)} ₽` : "—"}
          icon={ArrowUpDown}
        />
        <KpiCard
          title="Минимум"
          value={data.stats.min > 0 ? `${formatNumber(data.stats.min)} ₽` : "—"}
          icon={TrendingUp}
          trend="down"
        />
        <KpiCard
          title="Максимум"
          value={data.stats.max > 0 ? `${formatNumber(data.stats.max)} ₽` : "—"}
          icon={TrendingUp}
          trend="up"
        />
      </div>

      {/* Salary trend chart */}
      {trendForChart.length > 1 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Тренд зарплат (тыс. ₽ по неделям)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OverviewChart data={trendForChart} />
          </CardContent>
        </Card>
      )}

      {/* Breakdowns */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* By experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-primary" />
              Зарплата по опыту
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byExperience.length > 0 ? (
              <HorizontalBarChart
                data={data.byExperience.map((g) => ({
                  label: g.label,
                  value: Math.round(g.avg / 1000),
                  secondary: Math.round(g.median / 1000),
                }))}
                valueLabel="Средняя (тыс)"
                secondaryLabel="Медиана (тыс)"
              />
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        {/* Remote vs Office */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wifi className="h-4 w-4 text-primary" />
              Удалёнка vs Офис
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byRemote.length > 0 ? (
              <HorizontalBarChart
                data={data.byRemote.map((g) => ({
                  label: g.label,
                  value: Math.round(g.avg / 1000),
                  secondary: Math.round(g.median / 1000),
                }))}
                valueLabel="Средняя (тыс)"
                secondaryLabel="Медиана (тыс)"
              />
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Watchlist */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4 text-primary" />
            Watchlist работодателей
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.watchlist.length > 0 ? (
            <div className="space-y-2">
              {data.watchlist.map((w) => (
                <div
                  key={w.employer_id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{w.employer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {w.notify && (
                      <span className="text-xs text-muted-foreground">🔔 уведомления</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Добавьте работодателей через CLI: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">hot-vacancies</code> найдёт горячие вакансии
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function EmptyState() {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">
      Нет данных
    </p>
  );
}
