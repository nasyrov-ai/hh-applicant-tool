import { createStaticSupabase } from "@/lib/supabase-static";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { REVALIDATE } from "@/lib/constants";
import {
  Activity,
  Server,
  Database,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const metadata = { title: "Здоровье" };
export const revalidate = REVALIDATE.fast;

interface WorkerRow {
  worker_id: string;
  status: string;
  last_seen_at: string;
  version: string | null;
  hostname: string | null;
}

interface CommandRow {
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

export default async function HealthPage() {
  const supabase = createStaticSupabase();

  const now = Date.now(); // eslint-disable-line react-hooks/purity -- server component, not a hook
  const dayAgo = new Date(now - 86_400_000).toISOString();

  const [workersRes, commandsRes, syncRes] = await Promise.all([
    supabase
      .from("worker_status")
      .select("worker_id, status, last_seen_at, version, hostname")
      .order("last_seen_at", { ascending: false }),
    supabase
      .from("command_queue")
      .select("status, started_at, completed_at")
      .gte("created_at", dayAgo),
    supabase
      .from("sync_log")
      .select("type, synced_count, created_at")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const workers = (workersRes.data ?? []) as WorkerRow[];
  const commands = (commandsRes.data ?? []) as CommandRow[];
  const lastSync = (syncRes.data ?? [])[0] as
    | { type: string; synced_count: number; created_at: string }
    | undefined;

  // Compute metrics
  const completed = commands.filter((c) => c.status === "completed").length;
  const failed = commands.filter((c) => c.status === "failed").length;
  const running = commands.filter((c) => c.status === "running").length;
  const total = commands.length;
  const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "—";

  // Average duration for completed commands
  const durations: number[] = [];
  for (const c of commands) {
    if (c.status === "completed" && c.started_at && c.completed_at) {
      const d =
        new Date(c.completed_at).getTime() - new Date(c.started_at).getTime();
      if (d > 0) durations.push(d / 1000);
    }
  }
  const avgDuration =
    durations.length > 0
      ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)
      : null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Здоровье системы"
        description="Статус сервисов и метрики за 24 часа"
      />

      {/* Workers */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workers.length > 0 ? (
          workers.map((w) => {
            const lastSeen = new Date(w.last_seen_at);
            const stale = now - lastSeen.getTime() > 120_000;
            const isOnline = !stale && w.status === "online";

            return (
              <Card key={w.worker_id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isOnline ? "bg-success/10" : "bg-destructive/10"
                    }`}
                  >
                    <Server
                      className={`h-5 w-5 ${
                        isOnline ? "text-success" : "text-destructive"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{w.worker_id}</span>
                      <Badge variant={isOnline ? "success" : "destructive"}>
                        {isOnline ? "Online" : "Offline"}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {w.hostname && <span>{w.hostname} · </span>}
                      {w.version && <span>v{w.version} · </span>}
                      Последний отклик: {formatDateTime(w.last_seen_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">
                Нет зарегистрированных воркеров
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Metrics */}
      <h2 className="mt-8 mb-4 text-lg font-semibold">Метрики за 24 часа</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          icon={CheckCircle2}
          label="Выполнено"
          value={completed}
          color="text-success"
        />
        <MetricCard
          icon={XCircle}
          label="Ошибки"
          value={failed}
          color="text-destructive"
        />
        <MetricCard
          icon={Activity}
          label="Успешность"
          value={`${successRate}%`}
          color="text-primary"
        />
        <MetricCard
          icon={Clock}
          label="Средн. время"
          value={avgDuration ? `${avgDuration}с` : "—"}
          color="text-muted-foreground"
        />
      </div>

      {/* Services */}
      <h2 className="mt-8 mb-4 text-lg font-semibold">Статус сервисов</h2>
      <div className="space-y-2">
        <ServiceRow
          name="Supabase"
          icon={Database}
          status="ok"
          detail="Подключено"
        />
        <ServiceRow
          name="Последняя синхронизация"
          icon={Clock}
          status={lastSync ? "ok" : "warning"}
          detail={
            lastSync
              ? `${formatDateTime(lastSync.created_at)} (${lastSync.synced_count} строк)`
              : "Не выполнялась"
          }
        />
        <ServiceRow
          name="Активные команды"
          icon={Activity}
          status={running > 0 ? "ok" : "idle"}
          detail={running > 0 ? `${running} выполняется` : "Нет активных"}
        />
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <Icon className={`h-5 w-5 ${color}`} />
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceRow({
  name,
  icon: Icon,
  status,
  detail,
}: {
  name: string;
  icon: typeof Activity;
  status: "ok" | "warning" | "error" | "idle";
  detail: string;
}) {
  const statusConfig = {
    ok: { color: "bg-success", label: "OK" },
    warning: { color: "bg-warning", label: "Внимание" },
    error: { color: "bg-destructive", label: "Ошибка" },
    idle: { color: "bg-muted-foreground", label: "Idle" },
  }[status];

  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{detail}</span>
        <span className={`h-2 w-2 rounded-full ${statusConfig.color}`} />
      </div>
    </div>
  );
}
