// Cache the token per secret so we don't re-derive HMAC on every request.
// The secret never changes at runtime, so this is safe to cache at module level.
let _cachedToken: string | null = null;
let _cachedSecret: string | null = null;

export async function makeAuthToken(secret: string): Promise<string> {
  if (_cachedToken && _cachedSecret === secret) {
    return _cachedToken;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode("hh_dashboard"));
  _cachedToken = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  _cachedSecret = secret;
  return _cachedToken;
}
