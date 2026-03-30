"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { assertAuth } from "@/lib/auth";

export async function addToBlacklist(
  employerId: number,
  employerName: string,
  reason: string
) {
  await assertAuth();
  const supabase = await createServerSupabase();

  const { error } = await supabase.from("blacklist").upsert({
    employer_id: employerId,
    employer_name: employerName,
    reason: reason || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/blacklist");
}

export async function removeFromBlacklist(employerId: number) {
  await assertAuth();
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("blacklist")
    .delete()
    .eq("employer_id", employerId);

  if (error) throw new Error(error.message);
  revalidatePath("/blacklist");
}

export async function searchEmployers(query: string) {
  if (!query || query.length < 2) return [];

  await assertAuth();

  const escaped = query.replace(/[%_\\]/g, "\\$&");
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("employers")
    .select("id, name, alternate_url")
    .ilike("name", `%${escaped}%`)
    .limit(10);

  return data || [];
}
