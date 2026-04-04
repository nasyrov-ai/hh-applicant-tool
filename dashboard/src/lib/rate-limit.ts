const MAX_ENTRIES = 10_000;
const CLEANUP_INTERVAL_MS = 60_000;

const hits = new Map<string, { count: number; resetAt: number }>();
let lastCleanup = Date.now();

function cleanup(now: number) {
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) {
      hits.delete(key);
    }
  }
  lastCleanup = now;
}

export function rateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();

  // Periodic cleanup of expired entries to prevent memory leaks
  if (now - lastCleanup > CLEANUP_INTERVAL_MS || hits.size > MAX_ENTRIES) {
    cleanup(now);
  }

  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  entry.count++;
  const allowed = entry.count <= maxAttempts;
  return { allowed, remaining: Math.max(0, maxAttempts - entry.count) };
}
