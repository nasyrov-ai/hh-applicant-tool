"use client";

import { memo } from "react";
import type { FunnelStep } from "@/lib/types";

interface FunnelChartProps {
  steps: FunnelStep[];
}

const STEP_COLORS = ["#D4AF37", "#F5D061", "#10B981", "#EF4444"];

export const FunnelChart = memo(function FunnelChart({ steps }: FunnelChartProps) {
  const maxCount = steps[0]?.count || 1;

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const pct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
        // Ensure monotonic narrowing: never wider than previous
        const prevPcts = steps.slice(0, i).map((s) => (s.count / maxCount) * 100);
        const cappedPct = prevPcts.length > 0 ? Math.min(pct, Math.min(...prevPcts)) : pct;
        const barWidth = Math.max(cappedPct, 8); // min 8% so it's visible
        const color = STEP_COLORS[i] ?? STEP_COLORS[0];

        return (
          <div key={step.label} className="group">
            {/* Label row */}
            <div className="mb-1.5 flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium text-foreground">
                  {step.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {step.count.toLocaleString("ru-RU")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {step.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            {/* Bar */}
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/20">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: color,
                  boxShadow: `0 0 8px ${color}40, 0 0 2px ${color}60`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});
