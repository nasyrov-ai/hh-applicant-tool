"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { removeFromBlacklist } from "./actions";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { BlacklistEntry } from "@/lib/types";

export function BlacklistRow({ item }: { item: BlacklistEntry }) {
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      try {
        await removeFromBlacklist(item.employer_id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось разблокировать");
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div className="animate-fade-in">
          <p className="text-sm font-medium">{item.employer_name || `ID: ${item.employer_id}`}</p>
          {item.reason && (
            <p className="mt-0.5 text-xs text-muted-foreground">{item.reason}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Заблокирован: {formatDateTime(item.created_at)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={handleRemove}
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Разблокировать"}
        </Button>
      </CardContent>
    </Card>
  );
}
