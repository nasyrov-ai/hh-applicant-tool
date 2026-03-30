"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { addToBlacklist, searchEmployers } from "./actions";
import { Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { EmployerSearchResult } from "@/lib/types";

export function BlacklistActions() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EmployerSearchResult[]>([]);
  const [reason, setReason] = useState("");
  const [searching, startSearch] = useTransition();
  const [adding, startAdd] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        const data = await searchEmployers(q);
        setResults(data);
      });
    }, 300);
  }, []);

  function handleAdd(employer: EmployerSearchResult) {
    startAdd(async () => {
      await addToBlacklist(employer.id, employer.name, reason);
      toast.success("Добавлен в блэклист", { description: employer.name });
      setQuery("");
      setResults([]);
      setReason("");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Добавить в блэклист
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Поиск работодателя по имени..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setOpen(false); setQuery(""); setResults([]); }}
          >
            Отмена
          </Button>
        </div>

        {searching && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Ищем...
          </div>
        )}

        {results.length > 0 && (
          <>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Причина блокировки (необязательно)"
              className="mt-3 h-8 text-xs"
            />
            <div className="mt-2 space-y-1">
              {results.map((emp) => (
                <button
                  key={emp.id}
                  disabled={adding}
                  onClick={() => handleAdd(emp)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 disabled:opacity-50"
                >
                  <span>{emp.name}</span>
                  {adding ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <span className="text-xs text-destructive">Заблокировать</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {query.length >= 2 && !searching && results.length === 0 && (
          <p className="mt-3 text-xs text-muted-foreground">Ничего не найдено</p>
        )}
      </CardContent>
    </Card>
  );
}
