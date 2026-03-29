"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function saveSettings(entries: { key: string; value: unknown; description?: string }[]) {
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
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("worker_config").select("*");

  const result: Record<string, unknown> = {};
  (data || []).forEach((row: any) => {
    result[row.key] = row.value;
  });
  return result;
}
