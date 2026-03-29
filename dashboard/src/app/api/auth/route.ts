import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  const secret = process.env.DASHBOARD_SECRET;

  // Debug: log whether secret is loaded (not the value itself)
  console.log("AUTH: secret loaded =", !!secret, "password received =", !!password);

  if (!secret) {
    // No secret configured — allow any password (dev mode)
    const response = NextResponse.json({ ok: true });
    response.cookies.set("hh_dashboard_auth", password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  }

  if (password !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("hh_dashboard_auth", secret, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
