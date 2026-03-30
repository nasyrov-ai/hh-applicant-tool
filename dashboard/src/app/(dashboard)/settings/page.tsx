import { createServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Настройки — 1.618 worksearch" };
export const revalidate = 30;

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("worker_config").select("key, value");

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Настройки" description="Ошибка загрузки" />
        <div className="flex h-40 items-center justify-center rounded-xl border border-destructive/50 bg-card">
          <p className="text-sm text-destructive">Не удалось загрузить настройки.</p>
        </div>
      </div>
    );
  }

  const settings: Record<string, unknown> = {};
  (data || []).forEach((row: { key: string; value: unknown }) => {
    settings[row.key] = row.value;
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Настройки"
        description="Конфигурация AI, поиска и промптов"
      />
      <SettingsForm initial={settings} />
    </div>
  );
}
