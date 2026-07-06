const PREFIX = 'transit:';

/** Persist data with a timestamp. Failures (private mode, quota) are silent. */
export function writeCache(key: string, data: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, cachedAt: Date.now() }));
  } catch {
    // localStorage unavailable — caching is best-effort.
  }
}

/**
 * Read a cached entry. Returns null when missing, older than maxAgeMs,
 * or unreadable (corrupt entries are removed).
 */
export function readCache<T>(key: string, maxAgeMs: number): { data: T; cachedAt: number } | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' || parsed === null ||
      !('data' in parsed) || typeof (parsed as { cachedAt?: unknown }).cachedAt !== 'number'
    ) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    const { data, cachedAt } = parsed as { data: T; cachedAt: number };
    if (Date.now() - cachedAt > maxAgeMs) return null;
    return { data, cachedAt };
  } catch {
    try { localStorage.removeItem(PREFIX + key); } catch { /* unavailable */ }
    return null;
  }
}
