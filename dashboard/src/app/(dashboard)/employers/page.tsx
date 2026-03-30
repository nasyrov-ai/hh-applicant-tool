import { createServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ExternalLink, Globe, Mail, MapPin } from "lucide-react";
import type { Employer, EmployerSite } from "@/lib/types";

export const metadata = { title: "Работодатели — HH Dashboard" };
export const revalidate = 60;

interface SearchParams {
  page?: string;
}

const PAGE_SIZE = 30;

export default async function EmployersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabase();
  const page = Math.max(1, parseInt(params.page || "1", 10));

  const { data: employers, count, error } = await supabase
    .from("employers")
    .select("id, name, type, area_name, site_url, alternate_url, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Работодатели" description="Ошибка загрузки" />
        <Card className="border-destructive/50">
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-sm text-destructive">
              Не удалось загрузить работодателей. Попробуйте обновить страницу.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Получаем информацию о сайтах
  const employerIds = (employers || []).map((e: Employer) => e.id);
  const { data: sites } = employerIds.length > 0
    ? await supabase
        .from("employer_sites")
        .select("employer_id, site_url, emails, generator, powered_by, server_name")
        .in("employer_id", employerIds)
    : { data: [] };

  const sitesMap: Record<number, EmployerSite> = {};
  (sites || []).forEach((s: EmployerSite) => {
    sitesMap[s.employer_id] = s;
  });

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Работодатели"
        description={`В базе: ${count || 0}`}
      />

      <div className="grid gap-3">
        {(!employers || employers.length === 0) && (
          <EmptyState icon={Building2} title="Нет работодателей" />
        )}
        {(employers || []).map((emp: Employer) => {
          const site = sitesMap[emp.id];
          return (
            <Card
              key={emp.id}
              className="gap-0 py-0 transition-colors hover:border-border/80"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{emp.name}</h3>
                      {emp.type && (
                        <span className="text-xs text-muted-foreground">
                          {emp.type}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {emp.area_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {emp.area_name}
                        </span>
                      )}
                      {(emp.site_url || site?.site_url) && (
                        <a
                          href={emp.site_url || site?.site_url || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Globe className="h-3 w-3" />
                          {(emp.site_url || site?.site_url || "").replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      )}
                      {site?.emails && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {site.emails}
                        </span>
                      )}
                    </div>
                    {site && (site.generator || site.powered_by || site.server_name) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {site.generator && (
                          <Badge variant="secondary">{site.generator}</Badge>
                        )}
                        {site.powered_by && (
                          <Badge variant="secondary">{site.powered_by}</Badge>
                        )}
                        {site.server_name && (
                          <Badge variant="secondary">{site.server_name}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {emp.alternate_url && (
                    <a
                      href={emp.alternate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        baseHref="/employers"
      />
    </div>
  );
}
