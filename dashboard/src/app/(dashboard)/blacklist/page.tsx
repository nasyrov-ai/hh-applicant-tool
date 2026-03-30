import { createServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { BlacklistActions } from "./blacklist-actions";
import { BlacklistRow } from "./blacklist-row";
import { Card, CardContent } from "@/components/ui/card";
import { Ban } from "lucide-react";
import type { BlacklistEntry } from "@/lib/types";

export const revalidate = 30;

export default async function BlacklistPage() {
  const supabase = await createServerSupabase();

  const { data: blacklisted, error } = await supabase
    .from("blacklist")
    .select("employer_id, employer_name, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Блэклист" description="Ошибка загрузки" />
        <Card className="border-destructive/50">
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-sm text-destructive">Не удалось загрузить данные.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Блэклист"
        description={`${blacklisted?.length || 0} заблокированных работодателей`}
      />

      <BlacklistActions />

      <div className="mt-4 space-y-2">
        {(!blacklisted || blacklisted.length === 0) && (
          <EmptyState icon={Ban} title="Блэклист пуст" description="Работодатели не заблокированы" />
        )}
        {(blacklisted || []).map((item: BlacklistEntry) => (
          <BlacklistRow key={item.employer_id} item={item} />
        ))}
      </div>
    </div>
  );
}

