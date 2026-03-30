import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const PATHS_TO_REVALIDATE = [
  "/",
  "/negotiations",
  "/operations",
  "/schedules",
  "/settings",
];

export async function POST(request: NextRequest) {
  const secret = process.env.DASHBOARD_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "DASHBOARD_SECRET not configured" },
      { status: 500 },
    );
  }

  // Accept token from header or body
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  let bodyToken: string | null = null;
  try {
    const body = await request.json();
    bodyToken = body?.secret ?? null;
  } catch {
    // No body or invalid JSON — that's fine if header auth is present
  }

  if (token !== secret && bodyToken !== secret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  for (const path of PATHS_TO_REVALIDATE) {
    revalidatePath(path);
  }

  return NextResponse.json({
    revalidated: true,
    paths: PATHS_TO_REVALIDATE,
    timestamp: Date.now(),
  });
}
