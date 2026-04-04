"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportProps {
  data: {
    id: string;
    state: string;
    vacancy_id: number;
    employer_id: number | null;
    created_at: string;
    updated_at: string;
  }[];
}

function escapeCsv(val: unknown): string {
  const str = String(val ?? "");
  // Prevent formula injection
  const needsEscape = /^[=+\-@\t\r]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsEscape || str.includes(",") || str.includes("\n") || str.includes('"')
    ? `"${escaped}"`
    : escaped;
}

export function ExportButton({ data }: ExportProps) {
  const handleExport = useCallback(() => {
    const headers = [
      "ID",
      "Вакансия",
      "Работодатель",
      "Статус",
      "Создан",
      "Обновлён",
    ];
    const rows = data.map((n) => [
      escapeCsv(n.id),
      escapeCsv(n.vacancy_id),
      escapeCsv(n.employer_id ?? ""),
      escapeCsv(n.state),
      escapeCsv(n.created_at),
      escapeCsv(n.updated_at),
    ]);
    const csv = [headers.map(escapeCsv), ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `negotiations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="gap-1.5"
    >
      <Download className="h-3.5 w-3.5" />
      CSV
    </Button>
  );
}
