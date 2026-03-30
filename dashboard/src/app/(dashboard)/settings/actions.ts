"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { assertAuth } from "@/lib/auth";

const settingsEntrySchema = z.object({
  key: z.string().min(1).max(100),
  value: z.unknown(),
  description: z.string().max(500).optional(),
});

const saveSettingsSchema = z.array(settingsEntrySchema).min(1).max(100);

export async function saveSettings(entries: { key: string; value: unknown; description?: string }[]) {
  saveSettingsSchema.parse(entries);
  await assertAuth();
  const supabase = await createServerSupabase();

  const { error } = await supabase.from("worker_config").upsert(
    entries.map((entry) => ({
      key: entry.key,
      value: entry.value,
      description: entry.description || null,
    }))
  );
  if (error) throw new Error(`Failed to save settings: ${error.message}`);

  revalidatePath("/settings");
}

export async function loadSettings(): Promise<Record<string, unknown>> {
  await assertAuth();
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("worker_config").select("*");

  const result: Record<string, unknown> = {};
  (data || []).forEach((row: { key: string; value: unknown }) => {
    result[row.key] = row.value;
  });
  return result;
}
