import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import type { RejectionInsight } from "./queries";

export function RejectionCard({ insights }: { insights: RejectionInsight[] }) {
  if (insights.length === 0) return null;

  const maxRate = Math.max(...insights.map((i) => i.discardRate), 1);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Причины отказов
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight) => {
            const barWidth = Math.max((insight.discardRate / maxRate) * 100, 6);
            // Color intensity based on discard rate
            const isHigh = insight.discardRate >= 50;
            const isMed = insight.discardRate >= 25;

            return (
              <div key={insight.label} className="group">
                <div className="mb-1 flex items-baseline justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {insight.dimension}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">
                      {insight.label.replace(`${insight.dimension}: `, "")}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 shrink-0">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        isHigh
                          ? "text-destructive"
                          : isMed
                            ? "text-warning"
                            : "text-muted-foreground"
                      }`}
                    >
                      {insight.discardRate.toFixed(0)}%
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {insight.discardCount}/{insight.totalCount}
                    </span>
                  </div>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/30">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out group-hover:brightness-125 ${
                      isHigh
                        ? "bg-destructive/80"
                        : isMed
                          ? "bg-warning/70"
                          : "bg-muted-foreground/40"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
