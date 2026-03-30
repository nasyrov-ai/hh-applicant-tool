"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createBrowserSupabase } from "@/lib/supabase-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Clock, Square } from "lucide-react";
import { cancelCommand } from "./actions";

interface CommandStatusProps {
  commandId: string;
  onComplete?: () => void;
}

type Status = "pending" | "running" | "completed" | "failed" | "cancelled";

const statusConfig: Record<
  Status,
  {
    label: string;
    variant: "default" | "success" | "destructive" | "warning" | "muted";
    icon: typeof Clock;
  }
> = {
  pending: { label: "В очереди", variant: "muted", icon: Clock },
  running: { label: "Выполняется", variant: "warning", icon: Loader2 },
  completed: { label: "Завершено", variant: "success", icon: Check },
  failed: { label: "Ошибка", variant: "destructive", icon: X },
  cancelled: { label: "Отменено", variant: "muted", icon: X },
};

export function CommandStatus({ commandId, onComplete }: CommandStatusProps) {
  const [status, setStatus] = useState<Status>("pending");
  const [error, setError] = useState<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const supabase = createBrowserSupabase();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    function isTerminal(s: Status) {
      return s === "completed" || s === "failed" || s === "cancelled";
    }

    function handleStatus(s: Status, err: string | null) {
      setStatus(s);
      setError(err);
      if (isTerminal(s)) {
        onCompleteRef.current?.();
        if (channel) {
          supabase.removeChannel(channel);
          channel = null;
        }
      }
    }

    // Initial fetch
    supabase
      .from("command_queue")
      .select("status, error_message")
      .eq("id", commandId)
      .single()
      .then(({ data }: { data: { status: string; error_message: string | null } | null }) => {
        if (data) {
          handleStatus(data.status as Status, data.error_message);
        }
      });

    // Realtime subscription
    channel = supabase
      .channel(`command-${commandId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "command_queue",
          filter: `id=eq.${commandId}`,
        },
        (payload: { new: { status: string; error_message: string | null } }) => {
          handleStatus(
            payload.new.status as Status,
            payload.new.error_message
          );
        }
      )
      .subscribe((subStatus: string) => {
        if (subStatus === "CHANNEL_ERROR" || subStatus === "TIMED_OUT") {
          // Fallback: poll once on disconnect
          supabase.from("command_queue").select("status, error_message")
            .eq("id", commandId).single()
            .then(({ data }: { data: { status: string; error_message: string | null } | null }) => {
              if (data) handleStatus(data.status as Status, data.error_message);
            });
        }
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [commandId]); // onComplete excluded — stored in ref

  const [isPending, startTransition] = useTransition();
  const canCancel = status === "pending" || status === "running";

  function handleCancel() {
    startTransition(async () => {
      try {
        await cancelCommand(commandId);
      } catch {
        // Status will update via realtime subscription
      }
    });
  }

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 animate-fade-in">
      <Icon
        className={`h-4 w-4 ${
          status === "running"
            ? "animate-spin text-warning"
            : status === "completed"
              ? "text-success"
              : status === "failed"
                ? "text-destructive"
                : "text-muted-foreground"
        }`}
      />
      <Badge variant={config.variant}>{config.label}</Badge>
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
      {canCancel && (
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={handleCancel}
          className="ml-auto h-7 gap-1 px-2 text-xs"
        >
          <Square className="h-3 w-3" />
          Стоп
        </Button>
      )}
    </div>
  );
}
