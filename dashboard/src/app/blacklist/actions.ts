"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function addToBlacklist(
  employerId: number,
  employerName: string,
  reason: string
) {
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

  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("employers")
    .select("id, name, alternate_url")
    .ilike("name", `%${query}%`)
    .limit(10);

  return data || [];
}
