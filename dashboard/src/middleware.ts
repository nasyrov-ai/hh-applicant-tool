import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { makeAuthToken } from "@/lib/auth-token";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function middleware(request: NextRequest) {
  // Skip auth for login page and static assets
  if (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.startsWith("/api/claude-heartbeat") ||
    request.nextUrl.pathname.startsWith("/api/revalidate") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname === "/favicon.ico" ||
    request.nextUrl.pathname === "/setup" ||
    request.nextUrl.pathname === "/demo" ||
    request.nextUrl.pathname === "/pricing"
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
  if (authCookie?.value && authCookie.value.length === expectedToken.length &&
      safeCompare(authCookie.value, expectedToken)) {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next|favicon\\.ico|manifest\\.json|sw\\.js|logo\\.svg|icons/|.*\\.png$|.*\\.webp$).*)"],
};
