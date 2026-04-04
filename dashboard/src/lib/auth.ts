import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";
import { makeAuthToken } from "./auth-token";

export { makeAuthToken };

function safeCompare(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export async function assertAuth(): Promise<void> {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Unauthorized: DASHBOARD_SECRET is not configured");
    }
    return; // dev mode only
  }
  const cookieStore = await cookies();
  const token = cookieStore.get("hh_dashboard_auth")?.value;
  const expected = await makeAuthToken(secret);
  if (!token || !safeCompare(token, expected)) {
    throw new Error("Unauthorized");
  }
}
