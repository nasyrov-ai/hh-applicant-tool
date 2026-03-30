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
import { formatDateTime, stateLabel, stateBadgeVariant } from "@/lib/utils";
import type { Negotiation } from "@/lib/types";
import { MessagesSquare } from "lucide-react";
import { Pagination } from "@/components/pagination";
import { NegotiationsFilter } from "./filter";

export const metadata = { title: "Отклики — HH Dashboard" };
export const revalidate = 60;

interface SearchParams {
  state?: string;
  page?: string;
  q?: string;
}

const PAGE_SIZE = 25;

export default async function NegotiationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabase();
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const stateFilter = params.state || "";
  const search = params.q || "";

  let query = supabase
    .from("negotiations")
    .select(
      "id, state, vacancy_id, employer_id, resume_id, created_at, updated_at",
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (search) {
    const parsed = parseInt(search, 10);
    if (!isNaN(parsed)) {
      query = query.eq("vacancy_id", parsed);
    }
  }

  if (stateFilter === "invitation") {
    query = query.or("state.eq.interview,state.like.invitation%");
  } else if (stateFilter === "discard") {
    query = query.eq("state", "discard");
  } else if (stateFilter === "active") {
    query = query.not("state", "eq", "discard").not("state", "eq", "interview").not("state", "like", "invitation%");
  }

  const { data: negotiations, count, error } = await query;

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Отклики" description="Ошибка загрузки" />
        <Card className="border-destructive/50">
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-sm text-destructive">
              Не удалось загрузить отклики. Попробуйте обновить страницу.
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
        title="Отклики"
        description={`Всего: ${count || 0}`}
      />

      <NegotiationsFilter currentState={stateFilter} currentSearch={search} />

      <Card className="mt-4 overflow-x-auto">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Вакансия</TableHead>
                <TableHead>Работодатель</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Создан</TableHead>
                <TableHead>Обновлен</TableHead>
                <TableHead>Ссылка</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!negotiations || negotiations.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="p-0 hover:bg-transparent">
                    <EmptyState icon={MessagesSquare} title="Нет откликов" />
                  </TableCell>
                </TableRow>
              )}
              {(negotiations || []).map((n: Negotiation) => (
                <TableRow key={n.id} className="hover:bg-muted/50">
                  <TableCell className="max-w-xs truncate">
                    #{n.vacancy_id}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {n.employer_id || "\u2014"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={stateBadgeVariant(n.state)}>
                      {stateLabel(n.state)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(n.created_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(n.updated_at)}
                  </TableCell>
                  <TableCell>
                    <a
                      href={`https://hh.ru/vacancy/${n.vacancy_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      hh.ru
                    </a>
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
        baseHref="/negotiations"
        params={{ state: stateFilter, q: search }}
      />
    </div>
  );
}
