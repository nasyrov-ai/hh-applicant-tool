import { createStaticSupabase } from "@/lib/supabase-static";
import { experienceLabel } from "@/lib/utils";

export type Period = "7d" | "30d" | "90d" | "all";

function periodToDate(period: Period): string | null {
  if (period === "all") return null;
  const days = { "7d": 7, "30d": 30, "90d": 90 }[period];
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

interface VacancyRow {
  salary_from: number | null;
  salary_to: number | null;
  currency: string | null;
  experience: string | null;
  remote: boolean;
  published_at: string | null;
}

export interface SalaryStats {
  avg: number;
  median: number;
  min: number;
  max: number;
  count: number;
}

export interface SalaryByGroup {
  label: string;
  avg: number;
  median: number;
  count: number;
}

export interface SalaryTrendPoint {
  date: string;
  avg: number;
  count: number;
}

export interface WatchlistEntry {
  employer_id: number;
  employer_name: string;
  notify: boolean;
  created_at: string;
  fresh_vacancies: number;
}

export interface MarketData {
  stats: SalaryStats;
  byExperience: SalaryByGroup[];
  byRemote: SalaryByGroup[];
  trend: SalaryTrendPoint[];
  watchlist: WatchlistEntry[];
}

export async function getMarketData(period: Period): Promise<MarketData> {
  const supabase = createStaticSupabase();
  const since = periodToDate(period);

  // Parallel fetch
  let vacQuery = supabase
    .from("vacancies")
    .select("salary_from, salary_to, currency, experience, remote, published_at")
    .limit(5000);

  if (since) {
    vacQuery = vacQuery.gte("published_at", since);
  }

  const [vacResult, watchlistResult] = await Promise.all([
    vacQuery,
    supabase
      .from("employer_watchlist")
      .select("employer_id, employer_name, notify, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const vacancies = (vacResult.data ?? []) as VacancyRow[];
  const watchlistRaw = (watchlistResult.data ?? []) as {
    employer_id: number;
    employer_name: string;
    notify: boolean;
    created_at: string;
  }[];

  // Filter to vacancies with salary (RUR only for consistency)
  const withSalary = vacancies.filter(
    (v) => (v.salary_from || v.salary_to) && (!v.currency || v.currency === "RUR"),
  );

  const salaries = withSalary.map((v) => {
    const from = v.salary_from ?? 0;
    const to = v.salary_to ?? 0;
    return from && to ? (from + to) / 2 : from || to;
  }).filter((s) => s > 0);

  // Stats
  const sorted = [...salaries].sort((a, b) => a - b);
  const stats: SalaryStats = {
    avg: salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0,
    median: sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    count: salaries.length,
  };

  // By experience
  const byExperience = buildSalaryGroups(withSalary, (v) => {
    return experienceLabel(v.experience);
  });

  // By remote
  const byRemote = buildSalaryGroups(withSalary, (v) => {
    return v.remote ? "Удалёнка" : "Офис";
  });

  // Trend: group by week
  const trend = buildSalaryTrend(withSalary);

  const watchlist: WatchlistEntry[] = watchlistRaw.map((w) => ({
    ...w,
    fresh_vacancies: 0,
  }));

  return { stats, byExperience, byRemote, trend, watchlist };
}

function buildSalaryGroups(
  vacancies: VacancyRow[],
  keyFn: (v: VacancyRow) => string,
): SalaryByGroup[] {
  const groups = new Map<string, number[]>();

  for (const v of vacancies) {
    const key = keyFn(v);
    const sal = midSalary(v);
    if (!sal) continue;
    const arr = groups.get(key) ?? [];
    arr.push(sal);
    groups.set(key, arr);
  }

  return [...groups.entries()]
    .map(([label, sals]) => {
      const sorted = [...sals].sort((a, b) => a - b);
      return {
        label,
        avg: Math.round(sals.reduce((a, b) => a + b, 0) / sals.length),
        median: sorted[Math.floor(sorted.length / 2)],
        count: sals.length,
      };
    })
    .sort((a, b) => b.avg - a.avg);
}

function buildSalaryTrend(vacancies: VacancyRow[]): SalaryTrendPoint[] {
  const weeks = new Map<string, number[]>();

  for (const v of vacancies) {
    if (!v.published_at) continue;
    const sal = midSalary(v);
    if (!sal) continue;

    const d = new Date(v.published_at);
    // Group by week (Monday start)
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d);
    weekStart.setDate(diff);
    const key = weekStart.toISOString().slice(0, 10);

    const arr = weeks.get(key) ?? [];
    arr.push(sal);
    weeks.set(key, arr);
  }

  return [...weeks.entries()]
    .map(([date, sals]) => ({
      date,
      avg: Math.round(sals.reduce((a, b) => a + b, 0) / sals.length),
      count: sals.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function midSalary(v: VacancyRow): number | null {
  const from = v.salary_from ?? 0;
  const to = v.salary_to ?? 0;
  const mid = from && to ? (from + to) / 2 : from || to;
  return mid > 0 ? mid : null;
}

