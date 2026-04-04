import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { Send, UserCheck, XCircle, TrendingUp, Clock, Wifi, Briefcase, FileText } from "lucide-react";
import { getAnalyticsData, type Period } from "./queries";
import { RejectionCard } from "./rejection-card";
import dynamic from "next/dynamic";

const FunnelChart = dynamic(
  () => import("@/components/funnel-chart").then((m) => m.FunnelChart),
  { loading: () => <div className="h-[280px] animate-pulse rounded-xl bg-muted/50" /> },
);

const HorizontalBarChart = dynamic(
  () => import("@/components/bar-chart").then((m) => m.HorizontalBarChart),
  { loading: () => <div className="h-[240px] animate-pulse rounded-xl bg-muted/50" /> },
);

const PeriodSelector = dynamic(
  () => import("./period-selector").then((m) => m.PeriodSelector),
);

export const metadata = { title: "Аналитика — 1.618 worksearch" };
export const revalidate = 60;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const validPeriods = ["7d", "30d", "90d", "all"] as const;
  const period = (validPeriods as readonly string[]).includes(params.period ?? "")
    ? (params.period as Period)
    : "30d";
  const data = await getAnalyticsData(period);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Аналитика"
          description="Конверсия откликов, эффективность по резюме и вакансиям"
        />
        <PeriodSelector current={period} />
      </div>

      {/* KPI row */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Всего откликов"
          value={formatNumber(data.kpi.total)}
          icon={Send}
        />
        <KpiCard
          title="Приглашения"
          value={formatNumber(data.kpi.invitations)}
          subtitle={
            data.kpi.total > 0
              ? `${data.kpi.conversionRate.toFixed(1)}% конверсия`
              : undefined
          }
          icon={UserCheck}
          trend={data.kpi.conversionRate > 5 ? "up" : data.kpi.conversionRate > 0 ? "neutral" : undefined}
        />
        <KpiCard
          title="Отказы"
          value={formatNumber(data.kpi.discards)}
          subtitle={
            data.kpi.total > 0
              ? `${((data.kpi.discards / data.kpi.total) * 100).toFixed(1)}%`
              : undefined
          }
          icon={XCircle}
          trend={data.kpi.discards > data.kpi.invitations ? "down" : "neutral"}
        />
        <KpiCard
          title="Среднее время ответа"
          value={
            data.kpi.avgResponseDays !== null
              ? `${data.kpi.avgResponseDays.toFixed(1)} дн`
              : "—"
          }
          icon={Clock}
        />
      </div>

      {/* Funnel */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Воронка откликов
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.kpi.total > 0 ? (
            <FunnelChart steps={data.funnel} />
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Нет данных за выбранный период
            </p>
          )}
        </CardContent>
      </Card>

      {/* Rejection insights — uses pre-fetched data */}
      <RejectionCard insights={data.rejectionInsights} />

      {/* Breakdowns grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* By resume */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              По резюме
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byResume.length > 0 ? (
              <HorizontalBarChart
                data={data.byResume.slice(0, 8).map((b) => ({
                  label: b.label,
                  value: b.total,
                  secondary: b.invitations,
                }))}
                valueLabel="Отклики"
                secondaryLabel="Приглашения"
              />
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        {/* By experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-primary" />
              По опыту
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byExperience.length > 0 ? (
              <HorizontalBarChart
                data={data.byExperience.map((b) => ({
                  label: b.label,
                  value: b.total,
                  secondary: b.invitations,
                }))}
                valueLabel="Отклики"
                secondaryLabel="Приглашения"
              />
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        {/* By salary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              По зарплате
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.bySalary.length > 0 ? (
              <HorizontalBarChart
                data={data.bySalary.map((b) => ({
                  label: b.label,
                  value: b.total,
                  secondary: b.invitations,
                }))}
                valueLabel="Отклики"
                secondaryLabel="Приглашения"
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
                data={data.byRemote.map((b) => ({
                  label: b.label,
                  value: b.total,
                  secondary: b.invitations,
                }))}
                valueLabel="Отклики"
                secondaryLabel="Приглашения"
              />
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </div>
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
