import { createServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatNumber } from "@/lib/utils";
import type { Resume } from "@/lib/types";
import { Eye, ExternalLink, FileText, RefreshCw } from "lucide-react";

export const metadata = { title: "Резюме — 1.618 worksearch" };
export const revalidate = 60;

export default async function ResumesPage() {
  const supabase = await createServerSupabase();

  const { data: resumes, error } = await supabase
    .from("resumes")
    .select("id, title, status_id, status_name, alternate_url, can_publish_or_update, total_views, new_views, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Резюме" description="Ошибка загрузки" />
        <Card className="border-destructive/50">
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-sm text-destructive">
              Не удалось загрузить резюме. Попробуйте обновить страницу.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Резюме"
        description={`${resumes?.length || 0} резюме в базе`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(!resumes || resumes.length === 0) && (
          <div className="col-span-full">
            <EmptyState icon={FileText} title="Нет резюме" />
          </div>
        )}
        {(resumes || []).map((r: Resume) => (
          <Card
            key={r.id}
            className="gap-0 py-0 transition-colors hover:border-border/80"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-medium leading-tight">{r.title}</h3>
                {r.alternate_url && (
                  <a
                    href={r.alternate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <Badge
                  variant={
                    r.status_id === "published"
                      ? "success"
                      : r.status_id === "blocked"
                      ? "destructive"
                      : "muted"
                  }
                >
                  {r.status_name || r.status_id || "—"}
                </Badge>
                {r.can_publish_or_update && (
                  <span className="flex items-center gap-1 text-xs text-success">
                    <RefreshCw className="h-3 w-3" />
                    Можно обновить
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{formatNumber(r.total_views || 0)} просмотров</span>
                </div>
                {(r.new_views || 0) > 0 && (
                  <span className="text-primary">
                    +{formatNumber(r.new_views)} новых
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Обновлено: {formatDateTime(r.updated_at)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
