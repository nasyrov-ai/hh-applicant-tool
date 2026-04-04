import { createStaticSupabase } from "@/lib/supabase-static";
import { formatDateTime, stateLabel, formatNumber, stateBadgeVariant } from "@/lib/utils";
import type { RecentActivity } from "@/lib/types";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  UserCheck,
  XCircle,
  TrendingUp,
  Clock,
  ExternalLink,
} from "lucide-react";
import dynamic from "next/dynamic";

const OverviewChart = dynamic(
  () => import("./overview-chart").then((m) => m.OverviewChart),
  {
    loading: () => (
      <div className="h-[300px] rounded-xl bg-muted/50 animate-pulse" />
    ),
  }
);

export const metadata = { title: "Обзор — 1.618 worksearch" };
export const revalidate = 60;

async function getStats(supabase: ReturnType<typeof createStaticSupabase>) {
  const db = supabase;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalNegotiationsResult,
    invitationsResult,
    discardsResult,
    totalVacanciesResult,
    recentNegotiationsResult,
    recentActivityResult,
  ] = await Promise.all([
    db.from("negotiations").select("*", { count: "exact", head: true }),
    db.from("negotiations").select("*", { count: "exact", head: true }).or("state.eq.interview,state.like.invitation%"),
    db.from("negotiations").select("*", { count: "exact", head: true }).eq("state", "discard"),
    db.from("vacancies").select("*", { count: "exact", head: true }),
    db.from("negotiations").select("created_at").gte("created_at", thirtyDaysAgo.toISOString()).order("created_at", { ascending: true }),
    db.from("negotiations").select("id, state, vacancy_id, updated_at").order("updated_at", { ascending: false }).limit(10),
  ]);

  const errors = [
    totalNegotiationsResult,
    invitationsResult,
    discardsResult,
    totalVacanciesResult,
    recentNegotiationsResult,
    recentActivityResult,
  ].filter((r) => r.error);

  if (errors.length > 0) {
    const message = errors.map((r) => r.error?.message).join("; ");
    throw new Error(`Supabase error: ${message}`);
  }

  function dayKey(d: Date): string {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}.${mm}`;
  }

  const byDay: Record<string, number> = {};
  (recentNegotiationsResult.data || []).forEach((n) => {
    const key = dayKey(new Date(n.created_at));
    byDay[key] = (byDay[key] || 0) + 1;
  });

  // Fill all 30 days (including days with 0 applications)
  const chartData: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    chartData.push({ date: key, count: byDay[key] || 0 });
  }

  return {
    totalNegotiations: totalNegotiationsResult.count || 0,
    invitations: invitationsResult.count || 0,
    discards: discardsResult.count || 0,
    totalVacancies: totalVacanciesResult.count || 0,
    chartData,
    recentActivity: recentActivityResult.data || [],
  };
}

export default async function OverviewPage() {
  const supabase = createStaticSupabase();

  let stats;
  try {
    stats = await getStats(supabase);
  } catch (_e) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Обзор" description="Общая статистика по откликам и вакансиям" />
        <Card className="border-destructive/50">
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-sm text-destructive">
              Не удалось загрузить данные. Попробуйте обновить страницу.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const conversionRate =
    stats.totalNegotiations > 0
      ? ((stats.invitations / stats.totalNegotiations) * 100).toFixed(1)
      : "0";

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Обзор"
        description="Общая статистика по откликам и вакансиям"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-stagger">
        <KpiCard
          title="Всего откликов"
          value={formatNumber(stats.totalNegotiations)}
          icon={Send}
          subtitle={`${formatNumber(stats.totalVacancies)} вакансий в базе`}
        />
        <KpiCard
          title="Приглашения"
          value={formatNumber(stats.invitations)}
          icon={UserCheck}
          trend="up"
          subtitle={`${conversionRate}% конверсия`}
        />
        <KpiCard
          title="Отказы"
          value={formatNumber(stats.discards)}
          icon={XCircle}
          trend="down"
        />
        <KpiCard
          title="Конверсия"
          value={`${conversionRate}%`}
          icon={TrendingUp}
          subtitle="приглашения / отклики"
        />
      </div>

      {/* Chart */}
      <div className="mt-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
        <OverviewChart data={stats.chartData} />
      </div>

      {/* Recent Activity */}
      <Card className="mt-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Последние действия
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {stats.recentActivity.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Нет данных</p>
            )}
            {stats.recentActivity.map((item: RecentActivity) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Вакансия #{item.vacancy_id}
                    </p>
                    <Badge variant={stateBadgeVariant(item.state)} className="mt-0.5">
                      {stateLabel(item.state)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(item.updated_at)}
                  </span>
                  <a
                    href={`https://hh.ru/vacancy/${item.vacancy_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary opacity-0 transition-all group-hover:opacity-100 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    hh.ru
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
