import { createServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "@/components/page-header";
import { SchedulesList } from "./schedules-list";

export const revalidate = 30;

export default async function SchedulesPage() {
  const supabase = await createServerSupabase();

  const { data: schedules, error } = await supabase
    .from("cron_schedules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Расписание" description="Ошибка загрузки" />
        <div className="flex h-40 items-center justify-center rounded-xl border border-destructive/50 bg-card">
          <p className="text-sm text-destructive">Не удалось загрузить расписание.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Расписание"
        description={`${schedules?.length || 0} задач`}
      />
      <SchedulesList schedules={schedules || []} />
    </div>
  );
}
