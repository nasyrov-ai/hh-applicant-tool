"use client";

import { memo } from "react";

export interface BarItem {
  label: string;
  value: number;
  secondary?: number;
}

interface BarChartProps {
  data: BarItem[];
  valueLabel?: string;
  secondaryLabel?: string;
}

const PRIMARY_COLOR = "#D4AF37";
const SECONDARY_COLOR = "#10B981";

export const HorizontalBarChart = memo(function HorizontalBarChart({
  data,
  valueLabel,
  secondaryLabel,
}: BarChartProps) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.value, d.secondary ?? 0)), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const primaryPct = Math.max((item.value / maxVal) * 100, 3);
        const secondaryPct = item.secondary != null
          ? Math.max((item.secondary / maxVal) * 100, 3)
          : 0;

        return (
          <div key={item.label} className="group">
            {/* Label + values */}
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="truncate text-sm text-foreground" title={item.label}>
                {item.label}
              </span>
              <div className="flex items-baseline gap-3 shrink-0">
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {item.value.toLocaleString("ru-RU")}
                </span>
                {item.secondary != null && (
                  <span className="text-xs tabular-nums" style={{ color: SECONDARY_COLOR }}>
                    {item.secondary.toLocaleString("ru-RU")}
                  </span>
                )}
              </div>
            </div>
            {/* Bars */}
            <div className="flex flex-col gap-1">
              <div className="relative h-5 w-full overflow-hidden rounded-md bg-muted/20">
                <div
                  className="h-full rounded-md transition-all duration-500 ease-out group-hover:brightness-125"
                  style={{
                    width: `${primaryPct}%`,
                    backgroundColor: PRIMARY_COLOR,
                    opacity: 0.8,
                  }}
                />
              </div>
              {item.secondary != null && (
                <div className="relative h-2.5 w-full overflow-hidden rounded-md bg-muted/10">
                  <div
                    className="h-full rounded-md transition-all duration-500 ease-out group-hover:brightness-125"
                    style={{
                      width: `${secondaryPct}%`,
                      backgroundColor: SECONDARY_COLOR,
                      opacity: 0.6,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      {(valueLabel || secondaryLabel) && (
        <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
          {valueLabel && (
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PRIMARY_COLOR, opacity: 0.8 }} />
              {valueLabel}
            </div>
          )}
          {secondaryLabel && (
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SECONDARY_COLOR, opacity: 0.6 }} />
              {secondaryLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
