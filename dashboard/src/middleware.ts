import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { makeAuthToken } from "@/lib/auth-token";

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
