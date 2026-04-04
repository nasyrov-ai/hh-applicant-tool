import { createStaticSupabase } from "@/lib/supabase-static";
import type { FunnelStep, AnalyticsBreakdown } from "@/lib/types";
import { isInvitation, experienceLabel } from "@/lib/utils";

export type Period = "7d" | "30d" | "90d" | "all";

function periodToDate(period: Period): string | null {
  if (period === "all") return null;
  const days = { "7d": 7, "30d": 30, "90d": 90 }[period];
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

interface NegotiationRow {
  id: string;
  state: string;
  vacancy_id: number;
  employer_id: number | null;
  resume_id: string | null;
  created_at: string;
  updated_at: string;
}

interface VacancyRow {
  id: number;
  experience: string | null;
  salary_from: number | null;
  salary_to: number | null;
  remote: boolean;
}

interface ResumeRow {
  id: string;
  title: string;
}

export interface AnalyticsData {
  funnel: FunnelStep[];
  kpi: {
    total: number;
    invitations: number;
    discards: number;
    conversionRate: number;
    avgResponseDays: number | null;
  };
  byResume: AnalyticsBreakdown[];
  byExperience: AnalyticsBreakdown[];
  bySalary: AnalyticsBreakdown[];
  byRemote: AnalyticsBreakdown[];
  rejectionInsights: RejectionInsight[];
}

export async function getAnalyticsData(period: Period): Promise<AnalyticsData> {
  const supabase = createStaticSupabase();
  const since = periodToDate(period);

  // Fetch all negotiations for the period
  let query = supabase
    .from("negotiations")
    .select("id, state, vacancy_id, employer_id, resume_id, created_at, updated_at");

  if (since) {
    query = query.gte("created_at", since);
  }

  const { data: negotiations } = await query;
  const negs: NegotiationRow[] = (negotiations ?? []) as NegotiationRow[];

  // Collect unique vacancy_ids and resume_ids for manual joins
  const vacancyIds = [...new Set(negs.map((n) => n.vacancy_id))];
  const resumeIds = [...new Set(negs.map((n) => n.resume_id).filter(Boolean))] as string[];

  // Collect unique employer_ids for rejection insights
  const employerIds = [
    ...new Set(negs.map((n) => n.employer_id).filter(Boolean)),
  ] as number[];

  // Parallel fetch vacancies, resumes, and employers
  const [vacanciesRes, resumesRes, employersRes] = await Promise.all([
    vacancyIds.length > 0
      ? supabase
          .from("vacancies")
          .select("id, experience, salary_from, salary_to, remote")
          .in("id", vacancyIds.slice(0, 500))
      : Promise.resolve({ data: [] }),
    resumeIds.length > 0
      ? supabase.from("resumes").select("id, title").in("id", resumeIds)
      : Promise.resolve({ data: [] }),
    employerIds.length > 0
      ? supabase
          .from("employers")
          .select("id, name")
          .in("id", employerIds.slice(0, 200))
      : Promise.resolve({ data: [] }),
  ]);

  const vacancyMap = new Map<number, VacancyRow>();
  for (const v of (vacanciesRes.data ?? []) as VacancyRow[]) {
    vacancyMap.set(v.id, v);
  }

  const resumeMap = new Map<string, string>();
  for (const r of (resumesRes.data ?? []) as ResumeRow[]) {
    resumeMap.set(r.id, r.title);
  }

  const empMap = new Map<number, string>();
  for (const e of (employersRes.data ?? []) as { id: number; name: string }[]) {
    empMap.set(e.id, e.name);
  }

  // KPI
  const total = negs.length;
  const invitations = negs.filter((n) => isInvitation(n.state)).length;
  const discards = negs.filter((n) => n.state === "discard").length;
  const active = total - discards - invitations;
  const conversionRate = total > 0 ? (invitations / total) * 100 : 0;

  // Average response time (for those with updated_at != created_at)
  const responseTimes: number[] = [];
  for (const n of negs) {
    if (n.state !== "discard" && !isInvitation(n.state)) continue;
    const created = new Date(n.created_at).getTime();
    const updated = new Date(n.updated_at).getTime();
    const diff = updated - created;
    if (diff > 60_000) {
      responseTimes.push(diff);
    }
  }
  const avgResponseDays =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) /
        responseTimes.length /
        (1000 * 60 * 60 * 24)
      : null;

  // Funnel
  const funnel: FunnelStep[] = [
    { label: "Всего откликов", count: total, percentage: 100 },
    {
      label: "Активные",
      count: active,
      percentage: total > 0 ? (active / total) * 100 : 0,
    },
    {
      label: "Приглашения",
      count: invitations,
      percentage: total > 0 ? (invitations / total) * 100 : 0,
    },
    {
      label: "Отказы",
      count: discards,
      percentage: total > 0 ? (discards / total) * 100 : 0,
    },
  ];

  // Breakdowns
  const byResume = buildBreakdown(negs, (n) => {
    const rid = n.resume_id;
    if (!rid) return "Без резюме";
    return resumeMap.get(rid) ?? rid.slice(0, 8);
  });

  const byExperience = buildBreakdown(negs, (n) => {
    const v = vacancyMap.get(n.vacancy_id);
    return experienceLabel(v?.experience ?? null);
  });

  const bySalary = buildBreakdown(negs, (n) => {
    const v = vacancyMap.get(n.vacancy_id);
    return salaryBucket(v?.salary_from ?? null, v?.salary_to ?? null);
  });

  const byRemote = buildBreakdown(negs, (n) => {
    const v = vacancyMap.get(n.vacancy_id);
    if (!v) return "Неизвестно";
    return v.remote ? "Удалёнка" : "Офис";
  });

  // Rejection insights (computed from already-fetched data)
  const rejectionInsights = computeRejectionInsights(negs, vacancyMap, empMap);

  return {
    funnel,
    kpi: { total, invitations, discards, conversionRate, avgResponseDays },
    byResume,
    byExperience,
    bySalary,
    byRemote,
    rejectionInsights,
  };
}

function buildBreakdown(
  negs: NegotiationRow[],
  keyFn: (n: NegotiationRow) => string,
): AnalyticsBreakdown[] {
  const groups = new Map<
    string,
    { total: number; invitations: number; discards: number }
  >();

  for (const n of negs) {
    const key = keyFn(n);
    const g = groups.get(key) ?? { total: 0, invitations: 0, discards: 0 };
    g.total++;
    if (isInvitation(n.state)) g.invitations++;
    if (n.state === "discard") g.discards++;
    groups.set(key, g);
  }

  return [...groups.entries()]
    .map(([label, g]) => ({
      label,
      total: g.total,
      invitations: g.invitations,
      discards: g.discards,
      conversionRate: g.total > 0 ? (g.invitations / g.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// ---------------------------------------------------------------------------
// Rejection insights
// ---------------------------------------------------------------------------

export interface RejectionInsight {
  dimension: string;
  label: string;
  discardCount: number;
  totalCount: number;
  discardRate: number;
}

/**
 * Pure function: compute rejection insights from pre-fetched data.
 */
export function computeRejectionInsights(
  negs: Pick<NegotiationRow, "id" | "state" | "vacancy_id" | "employer_id">[],
  vacMap: Map<number, VacancyRow>,
  empMap: Map<number, string>,
): RejectionInsight[] {
  if (negs.length === 0) return [];

  type Bucket = { discards: number; total: number };
  const dimensions: { dimension: string; keyFn: (n: (typeof negs)[0]) => string }[] = [
    {
      dimension: "Опыт",
      keyFn: (n) => experienceLabel(vacMap.get(n.vacancy_id)?.experience ?? null),
    },
    {
      dimension: "Зарплата",
      keyFn: (n) => {
        const v = vacMap.get(n.vacancy_id);
        return salaryBucket(v?.salary_from ?? null, v?.salary_to ?? null);
      },
    },
    {
      dimension: "Формат",
      keyFn: (n) => {
        const v = vacMap.get(n.vacancy_id);
        if (!v) return "Неизвестно";
        return v.remote ? "Удалёнка" : "Офис";
      },
    },
    {
      dimension: "Работодатель",
      keyFn: (n) => {
        if (!n.employer_id) return "Неизвестно";
        return empMap.get(n.employer_id) ?? `#${n.employer_id}`;
      },
    },
  ];

  const insights: RejectionInsight[] = [];

  for (const { dimension, keyFn } of dimensions) {
    const buckets = new Map<string, Bucket>();
    for (const n of negs) {
      const key = keyFn(n);
      const b = buckets.get(key) ?? { discards: 0, total: 0 };
      b.total++;
      if (n.state === "discard") b.discards++;
      buckets.set(key, b);
    }

    for (const [label, b] of buckets) {
      if (b.total < 3) continue;
      insights.push({
        dimension,
        label: `${dimension}: ${label}`,
        discardCount: b.discards,
        totalCount: b.total,
        discardRate: (b.discards / b.total) * 100,
      });
    }
  }

  return insights
    .filter((i) => i.discardRate > 0)
    .sort((a, b) => b.discardRate - a.discardRate)
    .slice(0, 10);
}

function salaryBucket(from: number | null, to: number | null): string {
  const mid = from && to ? (from + to) / 2 : from ?? to;
  if (!mid) return "Не указана";
  if (mid < 50_000) return "до 50 тыс";
  if (mid < 100_000) return "50–100 тыс";
  if (mid < 200_000) return "100–200 тыс";
  if (mid < 300_000) return "200–300 тыс";
  return "300+ тыс";
}
