"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

interface KanbanNegotiation {
  id: string;
  state: string;
  vacancy_id: number;
  vacancy_name: string | null;
  employer_id: number | null;
  updated_at: string;
}

interface KanbanColumn {
  id: string;
  label: string;
  items: KanbanNegotiation[];
  total: number;
}

interface KanbanProps {
  columns: KanbanColumn[];
}

export function NegotiationsKanban({ columns }: KanbanProps) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => (
        <div key={col.id} className="space-y-2">
          {/* Column header */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-sm font-medium">{col.label}</span>
            <Badge variant="muted" className="text-xs">
              {col.total}
            </Badge>
          </div>

          {/* Cards */}
          <div className="space-y-2">
            {col.items.map((n) => (
              <Card key={n.id} className="group transition-colors hover:border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {n.vacancy_name || `#${n.vacancy_id}`}
                      </p>
                      {n.employer_id && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          ID: {n.employer_id}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(n.updated_at)}
                      </p>
                    </div>
                    <a
                      href={`https://hh.ru/vacancy/${n.vacancy_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}

            {col.items.length === 0 && (
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border">
                <p className="text-xs text-muted-foreground">Пусто</p>
              </div>
            )}

            {col.total > col.items.length && (
              <p className="text-center text-xs text-muted-foreground">
                + ещё {col.total - col.items.length}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
