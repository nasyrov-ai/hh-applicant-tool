"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";

function useServiceStatus(service: "worker" | "claude-code") {
  const [status, setStatus] = useState<"online" | "offline" | "unknown">("unknown");

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const isClaude = service === "claude-code";

    const query = supabase
      .from("worker_status")
      .select("worker_id, status, last_seen_at")
      .order("last_seen_at", { ascending: false });

    const filteredQuery = isClaude
      ? query.eq("worker_id", "claude-code")
      : query.neq("worker_id", "claude-code");

    filteredQuery
      .limit(1)
      .single()
      .then(({ data }: { data: { worker_id: string; status: string; last_seen_at: string } | null }) => {
        if (!data) {
          setStatus("unknown");
          return;
        }
        const lastSeen = new Date(data.last_seen_at);
        const stale = Date.now() - lastSeen.getTime() > 60_000;
        setStatus(stale ? "offline" : (data.status as "online" | "offline"));
      });

    const channel = supabase
      .channel(`service-status-${service}`)
      .on(
        "postgres_changes" as "system",
        { event: "*", schema: "public", table: "worker_status" } as Record<string, string>,
        (payload: { new: { worker_id: string; status: string; last_seen_at: string } }) => {
          const row = payload.new;
          if (!row?.status) return;
          const matchesClaude = row.worker_id === "claude-code";
          if (isClaude !== matchesClaude) return;
          const lastSeen = new Date(row.last_seen_at);
          const stale = Date.now() - lastSeen.getTime() > 60_000;
          setStatus(stale ? "offline" : (row.status as "online" | "offline"));
        }
      )
      .subscribe((st: string) => {
        if (st === "CHANNEL_ERROR" || st === "TIMED_OUT") {
          setStatus("unknown");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [service]);

  return status;
}

function StatusIndicator({ label, status }: { label: string; status: "online" | "offline" | "unknown" }) {
  const color =
    status === "online"
      ? "bg-success shadow-success/40 shadow-sm"
      : status === "offline"
        ? "bg-destructive"
        : "bg-muted-foreground";

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "h-2 w-2 rounded-full transition-all",
          color,
          status === "online" && "animate-pulse"
        )}
      />
      <span className="text-xs font-medium text-sidebar-foreground">{label}</span>
    </div>
  );
}

export function StatusIndicators() {
  const workerStatus = useServiceStatus("worker");
  const claudeStatus = useServiceStatus("claude-code");

  return (
    <div className="flex flex-col gap-1.5">
      <StatusIndicator label="Worker" status={workerStatus} />
      <StatusIndicator label="Claude" status={claudeStatus} />
    </div>
  );
}
