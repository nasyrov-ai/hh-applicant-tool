import { createStaticSupabase } from "@/lib/supabase-static";
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
import { formatDateTime, stateLabel, stateBadgeVariant, isInvitation } from "@/lib/utils";
import type { Negotiation } from "@/lib/types";
import { MessagesSquare } from "lucide-react";
import { Pagination } from "@/components/pagination";
import { NegotiationsFilter } from "./filter";
import { NegotiationsKanban } from "./kanban";
import { ViewToggle } from "./view-toggle";
import { ExportButton } from "./export-button";

export const metadata = { title: "Отклики — 1.618 worksearch" };
export const revalidate = 60;

interface SearchParams {
  state?: string;
  page?: string;
  q?: string;
  view?: string;
}

const PAGE_SIZE = 25;
const KANBAN_LIMIT = 20;

export default async function NegotiationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = createStaticSupabase();
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const stateFilter = params.state || "";
  const search = params.q || "";
  const view = params.view === "kanban" ? "kanban" : "table";

  if (view === "kanban") {
    return <KanbanView stateFilter={stateFilter} search={search} />;
  }

  // Table view (existing logic)
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

      <div className="flex items-center justify-between gap-4">
        <NegotiationsFilter currentState={stateFilter} currentSearch={search} />
        <div className="flex items-center gap-2">
          <ExportButton />
          <ViewToggle current={view} />
        </div>
      </div>

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

async function KanbanView({
  stateFilter,
  search,
}: {
  stateFilter: string;
  search: string;
}) {
  const supabase = createStaticSupabase();

  // Fetch negotiations for kanban with SQL-level filters
  let kanbanQuery = supabase
    .from("negotiations")
    .select("id, state, vacancy_id, employer_id, updated_at")
    .order("updated_at", { ascending: false })
    .limit(150);

  // Push search filter to SQL
  if (search) {
    const parsed = parseInt(search, 10);
    if (!isNaN(parsed)) {
      kanbanQuery = kanbanQuery.eq("vacancy_id", parsed);
    }
  }

  // Push state filter to SQL
  if (stateFilter === "invitation") {
    kanbanQuery = kanbanQuery.or("state.eq.interview,state.like.invitation%");
  } else if (stateFilter === "discard") {
    kanbanQuery = kanbanQuery.eq("state", "discard");
  } else if (stateFilter === "active") {
    kanbanQuery = kanbanQuery.not("state", "eq", "discard").not("state", "eq", "interview").not("state", "like", "invitation%");
  }

  const { data: allNegs } = await kanbanQuery;

  const negs = (allNegs ?? []) as {
    id: string;
    state: string;
    vacancy_id: number;
    employer_id: number | null;
    updated_at: string;
  }[];

  // Fetch vacancy names for display
  const vacancyIds = [...new Set(negs.map((n) => n.vacancy_id))];
  const { data: vacancies } = vacancyIds.length > 0
    ? await supabase
        .from("vacancies")
        .select("id, name")
        .in("id", vacancyIds.slice(0, 500))
    : { data: [] };

  const vacMap = new Map<number, string>();
  for (const v of (vacancies ?? []) as { id: number; name: string }[]) {
    vacMap.set(v.id, v.name);
  }

  // Bucket negotiations
  const buckets: Record<string, typeof negs> = {
    response: [],
    active: [],
    invitation: [],
    discard: [],
  };

  for (const n of negs) {
    if (isInvitation(n.state)) {
      buckets.invitation.push(n);
    } else if (n.state === "discard") {
      buckets.discard.push(n);
    } else if (n.state === "response" || n.state === "sent") {
      buckets.response.push(n);
    } else {
      buckets.active.push(n);
    }
  }

  // Apply state filter to visible columns
  const allColumns = [
    { id: "response", label: "Отклик", items: buckets.response },
    { id: "active", label: "Активный", items: buckets.active },
    { id: "invitation", label: "Приглашение", items: buckets.invitation },
    { id: "discard", label: "Отказ", items: buckets.discard },
  ];

  const filteredColumns =
    stateFilter === "invitation"
      ? allColumns.filter((c) => c.id === "invitation")
      : stateFilter === "discard"
        ? allColumns.filter((c) => c.id === "discard")
        : stateFilter === "active"
          ? allColumns.filter((c) => c.id !== "invitation" && c.id !== "discard")
          : allColumns;

  const columns = filteredColumns.map((col) => ({
    ...col,
    total: col.items.length,
    items: col.items.slice(0, KANBAN_LIMIT).map((n) => ({
      ...n,
      vacancy_name: vacMap.get(n.vacancy_id) ?? null,
    })),
  }));

  const totalCount = negs.length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Отклики"
        description={`Всего: ${totalCount}`}
      />

      <div className="flex items-center justify-between gap-4">
        <NegotiationsFilter currentState={stateFilter} currentSearch={search} />
        <ViewToggle current="kanban" />
      </div>

      <NegotiationsKanban columns={columns} />
    </div>
  );
}
