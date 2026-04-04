import { createStaticSupabase } from "@/lib/supabase-static";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, commandStatusVariant, commandStatusLabel } from "@/lib/utils";
import type { Command } from "@/lib/types";
import Link from "next/link";
import { ChevronRight, ScrollText } from "lucide-react";

export const metadata = { title: "Логи — 1.618 worksearch" };
export const revalidate = 60;

export default async function LogsPage() {
  const supabase = createStaticSupabase();

  const { data: commands, error } = await supabase
    .from("command_queue")
    .select("id, command, args, status, error_message, created_at, started_at, completed_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Логи" description="Ошибка загрузки" />
        <Card className="border-destructive/50">
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-sm text-destructive">Не удалось загрузить логи.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Логи"
        description="История выполненных команд"
      />

      <div className="space-y-2">
        {(!commands || commands.length === 0) && (
          <EmptyState icon={ScrollText} title="Нет команд" />
        )}
        {(commands || []).map((cmd: Command) => (
          <Link
            key={cmd.id}
            href={`/logs/${cmd.id}`}
            className="block"
          >
            <Card className="transition-colors hover:border-border/80 hover:bg-muted/20">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Badge variant={commandStatusVariant(cmd.status)}>
                    {commandStatusLabel(cmd.status)}
                  </Badge>
                  <div className="animate-fade-in">
                    <p className="text-sm font-medium">{cmd.command}</p>
                    {cmd.args && Object.keys(cmd.args).filter(k => !k.startsWith("_")).length > 0 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {Object.entries(cmd.args)
                          .filter(([k]) => !k.startsWith("_"))
                          .map(([k, v]) => `${k}=${v}`)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(cmd.created_at)}
                    </p>
                    {cmd.completed_at && cmd.started_at && (
                      <p className="text-xs text-muted-foreground">
                        {Math.round(
                          (new Date(cmd.completed_at).getTime() -
                            new Date(cmd.started_at).getTime()) /
                            1000
                        )}с
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
