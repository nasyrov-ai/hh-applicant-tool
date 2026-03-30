import { createServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSalary, formatDate, experienceLabel } from "@/lib/utils";
import type { Vacancy } from "@/lib/types";
import { Pagination } from "@/components/pagination";
import { VacanciesFilter } from "./filter";
import { Briefcase, ExternalLink, MapPin, Wifi } from "lucide-react";

export const metadata = { title: "Вакансии — HH Dashboard" };
export const revalidate = 60;

interface SearchParams {
  page?: string;
  exp?: string;
  remote?: string;
  salary_min?: string;
}

const PAGE_SIZE = 30;

export default async function VacanciesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabase();
  const page = Math.max(1, parseInt(params.page || "1", 10));

  let query = supabase
    .from("vacancies")
    .select("id, name, remote, area_name, salary_from, salary_to, currency, experience, published_at, created_at, updated_at, alternate_url", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (params.exp) {
    query = query.eq("experience", params.exp);
  }
  if (params.remote === "true") {
    query = query.eq("remote", true);
  }
  if (params.salary_min) {
    const min = parseInt(params.salary_min, 10);
    if (!isNaN(min)) {
      query = query.or(`salary_from.gte.${min},salary_to.gte.${min}`);
    }
  }

  const { data: vacancies, count, error } = await query;

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Вакансии" description="Ошибка загрузки" />
        <Card className="border-destructive/50">
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-sm text-destructive">
              Не удалось загрузить вакансии. Попробуйте обновить страницу.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Вакансии"
        description={`В базе: ${count || 0}`}
      />

      <VacanciesFilter
        currentExp={params.exp || ""}
        currentRemote={params.remote || ""}
        currentSalaryMin={params.salary_min || ""}
      />

      <Card className="mt-4 overflow-x-auto">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Вакансия</TableHead>
                <TableHead>Регион</TableHead>
                <TableHead>Зарплата</TableHead>
                <TableHead>Опыт</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!vacancies || vacancies.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="p-0 hover:bg-transparent">
                    <EmptyState icon={Briefcase} title="Нет вакансий" />
                  </TableCell>
                </TableRow>
              )}
              {(vacancies || []).map((v: Vacancy) => (
                <TableRow key={v.id} className="hover:bg-muted/50">
                  <TableCell className="max-w-sm">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{v.name}</span>
                      {v.remote && (
                        <Wifi className="h-3.5 w-3.5 shrink-0 text-success" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {v.area_name || "\u2014"}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatSalary(v.salary_from, v.salary_to, v.currency)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    <Badge variant="muted">{experienceLabel(v.experience)}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(v.published_at || v.created_at)}
                  </TableCell>
                  <TableCell>
                    {v.alternate_url && (
                      <a
                        href={v.alternate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        baseHref="/vacancies"
        params={{ exp: params.exp || "", remote: params.remote || "", salary_min: params.salary_min || "" }}
      />
    </div>
  );
}
