"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { assertAuth } from "@/lib/auth";

export async function createSchedule(data: {
  name: string;
  command: string;
  args: Record<string, unknown>;
  cron_expression: string;
}) {
  await assertAuth();
  const supabase = await createServerSupabase();

  const { error } = await supabase.from("cron_schedules").insert({
    name: data.name,
    command: data.command,
    args: data.args,
    cron_expression: data.cron_expression,
    enabled: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/schedules");
}

export async function toggleSchedule(id: string, enabled: boolean) {
  await assertAuth();
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("cron_schedules")
    .update({ enabled })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/schedules");
}

export async function deleteSchedule(id: string) {
  await assertAuth();
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("cron_schedules")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/schedules");
}
