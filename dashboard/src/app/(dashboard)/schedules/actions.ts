"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { assertAuth } from "@/lib/auth";

// Matches standard 5-field cron: minute hour dom month dow
const cronRegex = /^(\*|[\d,\-\/]+)\s+(\*|[\d,\-\/]+)\s+(\*|[\d,\-\/]+)\s+(\*|[\d,\-\/]+)\s+(\*|[\d,\-\/]+)$/;

const createScheduleSchema = z.object({
  name: z.string().min(1).max(100),
  command: z.string().min(1),
  args: z.record(z.string(), z.unknown()).default({}),
  cron_expression: z.string().regex(cronRegex, "Invalid cron expression"),
});

export async function createSchedule(data: {
  name: string;
  command: string;
  args: Record<string, unknown>;
  cron_expression: string;
}) {
  const parsed = createScheduleSchema.parse(data);
  await assertAuth();
  const supabase = await createServerSupabase();

  const { error } = await supabase.from("cron_schedules").insert({
    name: parsed.name,
    command: parsed.command,
    args: parsed.args,
    cron_expression: parsed.cron_expression,
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
