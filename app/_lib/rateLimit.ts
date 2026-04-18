// lru-cache v5 — default export is the constructor
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LRU = require("lru-cache") as new (opts: { max: number }) => {
  get(key: string): Entry | undefined;
  set(key: string, value: Entry): void;
};

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;

interface Entry {
  count: number;
  windowStart: number;
}

const cache = new LRU({ max: 5000 });

export function rateLimit(ip: string | null): { allowed: boolean } {
  // No identifiable IP — allow through (Vercel always sets x-forwarded-for in prod)
  if (ip === null) return { allowed: true };

  const now = Date.now();
  const entry = cache.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    cache.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false };
  }

  cache.set(ip, { count: entry.count + 1, windowStart: entry.windowStart });
  return { allowed: true };
}

// Returns the original client IP from x-forwarded-for, or null if not present.
// In a Vercel deployment x-forwarded-for is always injected by the edge network.
export function getClientIp(req: { headers: { get(name: string): string | null } }): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  return ip ?? null;
}
