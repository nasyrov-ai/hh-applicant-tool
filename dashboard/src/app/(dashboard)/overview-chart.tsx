"use client";

import { NegotiationsChart } from "@/components/chart";

export function OverviewChart({ data }: { data: { date: string; count: number }[] }) {
  return <NegotiationsChart data={data} title="Отклики за последние 30 дней" />;
}
