import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";

const WORKER_ID = "claude-code";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(request: NextRequest) {
  const secret = process.env.DASHBOARD_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!secret || !serviceKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Missing required env vars (DASHBOARD_SECRET, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL)" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token || !safeCompare(token, secret)) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { error } = await supabase.from("worker_status").upsert(
    {
      worker_id: WORKER_ID,
      status: "online",
      last_seen_at: new Date().toISOString(),
      version: "claude-code",
      hostname: "local",
    },
    { onConflict: "worker_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, timestamp: Date.now() });
}
