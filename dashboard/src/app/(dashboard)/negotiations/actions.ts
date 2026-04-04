"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { assertAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function exportAllNegotiations() {
  await assertAuth();
  const supabase = await createServerSupabase();

  const PAGE = 1000;
  const all: {
    id: string;
    state: string;
    vacancy_id: number;
    employer_id: number | null;
    created_at: string;
    updated_at: string;
  }[] = [];
  let offset = 0;

  // Paginate to fetch all rows (bypass Supabase default 1000-row limit)
   
  while (true) {
    const { data } = await supabase
      .from("negotiations")
      .select("id, state, vacancy_id, employer_id, created_at, updated_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE - 1);

    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < PAGE) break;
    offset += PAGE;
  }

  return all;
}

export async function clearDiscardedNegotiations() {
  await assertAuth();
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("negotiations")
    .delete()
    .eq("state", "discard");

  if (error) throw new Error(error.message);
  revalidatePath("/negotiations");
}
