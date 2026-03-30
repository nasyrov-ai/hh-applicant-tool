import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function makeAuthToken(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode("hh_dashboard"));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  // Skip auth for login page and static assets
  if (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const secret = process.env.DASHBOARD_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    // Dev mode without secret — allow all
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("hh_dashboard_auth");
  const expectedToken = await makeAuthToken(secret);
  if (authCookie?.value === expectedToken) {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
