import { cookies } from "next/headers";
import { makeAuthToken } from "./auth-token";

export { makeAuthToken };

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
  if (!token || token !== await makeAuthToken(secret)) {
    throw new Error("Unauthorized");
  }
}
