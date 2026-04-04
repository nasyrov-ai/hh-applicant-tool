"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { assertAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
