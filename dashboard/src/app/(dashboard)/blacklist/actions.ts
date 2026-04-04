"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { assertAuth } from "@/lib/auth";

const employerIdSchema = z.number().int().positive();

const addSchema = z.object({
  employerId: z.number().int().positive(),
  employerName: z.string().min(1).max(500),
  reason: z.string().max(1000).default(""),
});

export async function addToBlacklist(
  employerId: number,
  employerName: string,
  reason: string
) {
  const validated = addSchema.parse({ employerId, employerName, reason });
  await assertAuth();
  const supabase = await createServerSupabase();

  const { error } = await supabase.from("blacklist").upsert({
    employer_id: validated.employerId,
    employer_name: validated.employerName,
    reason: validated.reason || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/blacklist");
}

export async function removeFromBlacklist(employerId: number) {
  employerIdSchema.parse(employerId);
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
