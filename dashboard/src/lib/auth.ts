import { cookies } from "next/headers";

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

export async function assertAuth(): Promise<void> {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) return; // dev mode
  const cookieStore = await cookies();
  const token = cookieStore.get("hh_dashboard_auth")?.value;
  if (!token || token !== await makeAuthToken(secret)) {
    throw new Error("Unauthorized");
  }
}
