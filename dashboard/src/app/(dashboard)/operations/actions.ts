"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { assertAuth } from "@/lib/auth";

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

  await assertAuth();

  const supabase = await createServerSupabase();

  // Prevent duplicate commands
  const { data: existing } = await supabase
    .from("command_queue")
    .select("id")
    .eq("command", command)
    .in("status", ["pending", "running"])
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error(`Команда "${command}" уже выполняется или в очереди`);
  }

  const { data, error } = await supabase
    .from("command_queue")
    .insert({ command, args, status: "pending" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getActiveCommands(): Promise<
  { id: string; command: string; status: string }[]
> {
  await assertAuth();
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("command_queue")
    .select("id, command, status")
    .in("status", ["pending", "running"])
    .order("created_at", { ascending: false });

  return data || [];
}

export async function cancelCommand(commandId: string) {
  await assertAuth();
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("command_queue")
    .update({ status: "cancelled" })
    .eq("id", commandId)
    .in("status", ["pending", "running"]);

  if (error) throw new Error(error.message);
}
