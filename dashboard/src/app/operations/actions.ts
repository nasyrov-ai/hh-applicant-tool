"use server";

import { createServerSupabase } from "@/lib/supabase-server";

const ALLOWED_COMMANDS = [
  "apply-vacancies",
  "reply-employers",
  "update-resumes",
  "clear-negotiations",
  "sync-db",
  "refresh-token",
];

export async function executeCommand(
  command: string,
  args: Record<string, unknown> = {}
) {
  if (!ALLOWED_COMMANDS.includes(command)) {
    throw new Error(`Unknown command: ${command}`);
  }

  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("command_queue")
    .insert({ command, args, status: "pending" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function cancelCommand(commandId: string) {
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("command_queue")
    .update({ status: "cancelled" })
    .eq("id", commandId)
    .in("status", ["pending", "running"]);

  if (error) throw new Error(error.message);
}
