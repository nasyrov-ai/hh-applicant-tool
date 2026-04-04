"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { assertAuth } from "@/lib/auth";
import { ALLOWED_COMMANDS } from "@/lib/commands";

// Matches standard 5-field cron: minute hour dom month dow
const cronRegex = /^(\*|[\d,\-/]+)\s+(\*|[\d,\-/]+)\s+(\*|[\d,\-/]+)\s+(\*|[\d,\-/]+)\s+(\*|[\d,\-/]+)$/;

// Schedule preset templates
const SCHEDULE_PRESETS: Record<
  string,
  { name: string; command: string; args: Record<string, unknown>; cron_expression: string }[]
> = {
  active: [
    { name: "Отклики утро", command: "apply-vacancies", args: { "use-ai": true }, cron_expression: "0 9 * * 1-5" },
    { name: "Отклики день", command: "apply-vacancies", args: { "use-ai": true }, cron_expression: "0 13 * * 1-5" },
    { name: "Отклики вечер", command: "apply-vacancies", args: { "use-ai": true }, cron_expression: "0 18 * * 1-5" },
    { name: "Синхронизация", command: "sync-db", args: {}, cron_expression: "0 9-21 * * *" },
    { name: "Горячие вакансии", command: "hot-vacancies", args: {}, cron_expression: "0 */3 * * *" },
    { name: "Обновить резюме", command: "update-resumes", args: {}, cron_expression: "0 8 * * 1-5" },
  ],
  passive: [
    { name: "Отклики", command: "apply-vacancies", args: { "use-ai": true }, cron_expression: "0 10 * * 1-5" },
    { name: "Ответы", command: "reply-employers", args: { "use-ai": true }, cron_expression: "0 14 * * 1-5" },
    { name: "Си��хронизация утро", command: "sync-db", args: {}, cron_expression: "0 9 * * *" },
    { name: "Синхронизация вечер", command: "sync-db", args: {}, cron_expression: "0 20 * * *" },
  ],
  weekend: [
    { name: "Ответы", command: "reply-employers", args: { "use-ai": true }, cron_expression: "0 12 * * *" },
    { name: "Синхронизация", command: "sync-db", args: {}, cron_expression: "0 10 * * *" },
  ],
};

const createScheduleSchema = z.object({
  name: z.string().min(1).max(100),
  command: z.enum(ALLOWED_COMMANDS),
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

const uuidSchema = z.string().uuid();

export async function toggleSchedule(id: string, enabled: boolean) {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) throw new Error("Invalid schedule ID");

  await assertAuth();
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("cron_schedules")
    .update({ enabled })
    .eq("id", parsed.data);

  if (error) throw new Error(error.message);
  revalidatePath("/schedules");
}

const presetIdSchema = z.enum(["active", "passive", "weekend"]);

export async function applySchedulePreset(presetId: string) {
  const parsedPreset = presetIdSchema.safeParse(presetId);
  if (!parsedPreset.success) throw new Error(`Unknown preset: ${presetId}`);

  const preset = SCHEDULE_PRESETS[parsedPreset.data];

  await assertAuth();
  const supabase = await createServerSupabase();

  // Insert new schedules first (safe: if this fails, old schedules remain)
  const { error: insertError } = await supabase.from("cron_schedules").insert(
    preset.map((s) => ({
      name: s.name,
      command: s.command,
      args: s.args,
      cron_expression: s.cron_expression,
      enabled: true,
    })),
  );

  if (insertError) throw new Error(insertError.message);

  // Fetch IDs of newly inserted schedules to protect them during delete
  const { data: newSchedules } = await supabase
    .from("cron_schedules")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(preset.length);

  const newIds = (newSchedules ?? []).map((s: { id: string }) => s.id);

  // Delete old schedules (everything except the ones we just inserted)
  if (newIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("cron_schedules")
      .delete()
      .not("id", "in", `(${newIds.join(",")})`);

    if (deleteError) throw new Error(deleteError.message);
  }

  revalidatePath("/schedules");
}

export async function deleteSchedule(id: string) {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) throw new Error("Invalid schedule ID");

  await assertAuth();
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("cron_schedules")
    .delete()
    .eq("id", parsed.data);

  if (error) throw new Error(error.message);
  revalidatePath("/schedules");
}
