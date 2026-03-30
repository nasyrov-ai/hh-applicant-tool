import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

export function KpiCard({ title, value, subtitle, icon: Icon, trend }: KpiCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-[rgba(212,175,55,0.18)] hover:shadow-[0_8px_40px_rgba(212,175,55,0.08),0_0_0_1px_rgba(212,175,55,0.12)] hover:-translate-y-0.5">
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(212,175,55,0.04)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
        {subtitle && (
          <p
            className={cn(
              "mt-1.5 text-xs font-medium",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              (!trend || trend === "neutral") && "text-muted-foreground"
            )}
          >
            {trend === "up" && "↑ "}
            {trend === "down" && "↓ "}
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
