"use server";

import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase-server";
import { assertAuth } from "@/lib/auth";
import { ALLOWED_COMMANDS } from "@/lib/commands";

const ALLOWED_ARG_KEYS = [
  "resume_id", "area_id", "limit", "dry_run",
  "search", "total-pages", "use-ai",
  "period",
  "delete-chat", "blacklist-discard", "block-ats",
  "full",
  "hours", "top", "salary-multiplier",
] as const;

const executeCommandSchema = z.object({
  command: z.enum(ALLOWED_COMMANDS),
  args: z
    .record(z.string(), z.unknown())
    .refine(
      (obj) => Object.keys(obj).every((k) => (ALLOWED_ARG_KEYS as readonly string[]).includes(k)),
      { message: "Unknown argument key" }
    )
    .default({}),
});

export async function executeCommand(
  command: string,
  args: Record<string, unknown> = {}
) {
  const parsed = executeCommandSchema.safeParse({ command, args });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const validatedCommand = parsed.data.command;
  const validatedArgs = parsed.data.args;

  await assertAuth();

  const supabase = await createServerSupabase();

  // Prevent duplicate commands
  const { data: existing } = await supabase
    .from("command_queue")
    .select("id")
    .eq("command", validatedCommand)
    .in("status", ["pending", "running"])
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error(`Команда "${validatedCommand}" уже выполняется или в очереди`);
  }

  const { data, error } = await supabase
    .from("command_queue")
    .insert({ command: validatedCommand, args: validatedArgs, status: "pending" })
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

const uuidSchema = z.string().uuid();

export async function cancelCommand(commandId: string) {
  const parsed = uuidSchema.safeParse(commandId);
  if (!parsed.success) throw new Error("Invalid command ID");

  await assertAuth();
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("command_queue")
    .update({ status: "cancelled" })
    .eq("id", parsed.data)
    .in("status", ["pending", "running"]);

  if (error) throw new Error(error.message);
}

export async function retryCommand(commandId: string) {
  const parsed = uuidSchema.safeParse(commandId);
  if (!parsed.success) throw new Error("Invalid command ID");

  await assertAuth();
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("command_queue")
    .update({
      status: "pending",
      exit_code: null,
      error_message: null,
      started_at: null,
      completed_at: null,
    })
    .eq("id", parsed.data)
    .eq("status", "failed");

  if (error) throw new Error(error.message);
}
