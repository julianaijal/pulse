# PWA with Offline Cached Data — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app an installable PWA that opens offline and shows last-known departures (marked stale) before falling back to demo data.

**Architecture:** Hand-rolled service worker (`public/sw.js`) handles the app shell only (cache-first static assets, network-first navigations). Departure data caching lives in `useDepartures` via a small `localStorage` utility, so the UI always knows whether data is live, cached, or demo. A generalized banner communicates stale data with a timestamp.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, vitest (node environment), plain-JS service worker (no build step, no new dependencies).

**Spec:** `docs/superpowers/specs/2026-07-06-pwa-offline-design.md`

## Global Constraints

- Linear issue: **PRO-29**. Every commit message body includes `PRO-29`. Branch: `julianaijal/pro-29-pwa-offline` (already checked out).
- Small, atomic commits — one logical change per commit (CLAUDE.md).
- No new npm dependencies. `next-pwa` gets **removed** (Task 6).
- No SW caching of `/api/*` — data caching is exclusively the hook's job.
- Cache TTL: **1 hour** (`departuresCacheTtlMs: 3_600_000` in `config/app.config.tsx`).
- `useJourney` is intentionally NOT modified.
- vitest runs in `environment: "node"` — tests must stub `localStorage` via `vi.stubGlobal`.
- Path alias `@/*` maps to repo root (tsconfig.json).
- CSP in `next.config.ts` must NOT be changed (`default-src 'self'` already covers a same-origin SW).

---

### Task 1: App icons and manifest fix

**Files:**
- Create: `public/favicon/icon-192.png`, `public/favicon/icon-512.png`, `public/favicon/icon-512-maskable.png` (generated, not hand-written)
- Modify: `public/manifest.json`

**Interfaces:**
- Consumes: `app/favicon.ico` (contains a 256×256 frame; verified with `sips -g pixelWidth`)
- Produces: three PNGs referenced by `manifest.json`; Task 5's SW caches `/favicon/*` cache-first

- [ ] **Step 1: Generate icons from favicon.ico** (macOS `sips`, no new tooling)

```bash
cd /Users/aijal000/code/transit
sips -s format png -z 192 192 app/favicon.ico --out public/favicon/icon-192.png
sips -s format png -z 512 512 app/favicon.ico --out public/favicon/icon-512.png
# Maskable: artwork at ~80% of canvas, padded to 512x512 with the theme background
sips -s format png -z 410 410 app/favicon.ico --out public/favicon/icon-512-maskable.png
sips --padToHeightWidth 512 512 --padColor F2F4F8 public/favicon/icon-512-maskable.png
```

- [ ] **Step 2: Verify output dimensions and format**

Run: `sips -g pixelWidth -g pixelHeight -g format public/favicon/*.png`
Expected: 192/192, 512/512, 512/512, all `format: png`. If `sips` fails to read the `.ico` (multi-frame edge case), first extract the largest frame: `sips -s format png app/favicon.ico --out /tmp/base.png`, verify `/tmp/base.png` is 256×256, then rerun Step 1 commands against `/tmp/base.png`.

- [ ] **Step 3: Update the manifest**

Replace the full contents of `public/manifest.json` with:

```json
{
  "name": "Transit",
  "short_name": "Transit",
  "description": "Real-time transit departures",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F2F4F8",
  "theme_color": "#F2F4F8",
  "icons": [
    { "src": "/favicon/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/favicon/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/favicon/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

(`theme_color`/`background_color` align with the viewport `themeColor: '#F2F4F8'` in `app/layout.tsx:30`.)

- [ ] **Step 4: Commit**

```bash
git add public/favicon public/manifest.json
git commit -m "$(cat <<'EOF'
feat: add PWA icons and fix manifest

Generate 192/512/maskable icons from favicon.ico and align
manifest theme colors with the app viewport.

PRO-29

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Data cache utility (TDD)

**Files:**
- Create: `app/_utils/dataCache.ts`
- Create: `app/_utils/dataCache.test.ts`
- Modify: `config/app.config.tsx`

**Interfaces:**
- Consumes: nothing from other tasks
- Produces:
  - `writeCache(key: string, data: unknown): void`
  - `readCache<T>(key: string, maxAgeMs: number): { data: T; cachedAt: number } | null`
  - `appConfig.departuresCacheTtlMs: number` (3_600_000)
  - Keys are stored under a `transit:` prefix in `localStorage`. Task 3 uses key `departures:{code}`.

- [ ] **Step 1: Add the TTL constant to config**

Replace the full contents of `config/app.config.tsx` with:

```tsx
const appConfig = {
  analyticsId: process.env.NEXT_PUBLIC_GA_ID ?? "",
  // Cached departures older than this are treated as absent (fall through to demo data).
  departuresCacheTtlMs: 60 * 60 * 1000,
};

export default appConfig;
```

- [ ] **Step 2: Write the failing tests**

Create `app/_utils/dataCache.test.ts` (pattern follows `app/_lib/rateLimit.test.ts`; vitest env is node, so `localStorage` is stubbed):

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readCache, writeCache } from './dataCache';

function fakeStorage() {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  };
}

describe('dataCache', () => {
  let storage: ReturnType<typeof fakeStorage>;

  beforeEach(() => {
    storage = fakeStorage();
    vi.stubGlobal('localStorage', storage);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('roundtrips data with a timestamp', () => {
    vi.setSystemTime(1000);
    writeCache('departures:ASD', [{ id: 'x' }]);

    const hit = readCache<{ id: string }[]>('departures:ASD', 60_000);

    expect(hit).not.toBeNull();
    expect(hit!.data).toEqual([{ id: 'x' }]);
    expect(hit!.cachedAt).toBe(1000);
  });

  it('returns null for a missing key', () => {
    expect(readCache('departures:UT', 60_000)).toBeNull();
  });

  it('treats entries older than maxAgeMs as absent', () => {
    vi.setSystemTime(1000);
    writeCache('departures:ASD', [1, 2]);
    vi.setSystemTime(1000 + 60_001);

    expect(readCache('departures:ASD', 60_000)).toBeNull();
  });

  it('still returns entries at exactly maxAgeMs', () => {
    vi.setSystemTime(1000);
    writeCache('departures:ASD', [1]);
    vi.setSystemTime(1000 + 60_000);

    expect(readCache('departures:ASD', 60_000)).not.toBeNull();
  });

  it('treats corrupt JSON as a miss and deletes the entry', () => {
    storage.store.set('transit:departures:ASD', '{not json');

    expect(readCache('departures:ASD', 60_000)).toBeNull();
    expect(storage.store.has('transit:departures:ASD')).toBe(false);
  });

  it('treats entries with a bad shape as a miss and deletes them', () => {
    storage.store.set('transit:departures:ASD', JSON.stringify({ nope: true }));

    expect(readCache('departures:ASD', 60_000)).toBeNull();
    expect(storage.store.has('transit:departures:ASD')).toBe(false);
  });

  it('does not throw when localStorage throws (write)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('quota'); },
      removeItem: () => { throw new Error('denied'); },
    });

    expect(() => writeCache('departures:ASD', [1])).not.toThrow();
    expect(readCache('departures:ASD', 60_000)).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run app/_utils/dataCache.test.ts`
Expected: FAIL — `Cannot find module './dataCache'` (or equivalent resolution error).

- [ ] **Step 4: Implement the utility**

Create `app/_utils/dataCache.ts`:

```ts
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run app/_utils/dataCache.test.ts`
Expected: PASS (7 tests). Also run the full suite: `npm test` — expected all green (includes `rateLimit.test.ts`).

- [ ] **Step 6: Commit**

```bash
git add app/_utils/dataCache.ts app/_utils/dataCache.test.ts config/app.config.tsx
git commit -m "$(cat <<'EOF'
feat: add localStorage data cache with TTL

writeCache/readCache utility with 1h departures TTL in app config;
corrupt or expired entries behave as misses.

PRO-29

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Cached fallback in useDepartures

**Files:**
- Modify: `app/_hooks/useDepartures.ts` (full replacement below)

**Interfaces:**
- Consumes: `writeCache` / `readCache` from `app/_utils/dataCache` (Task 2), `appConfig.departuresCacheTtlMs` (Task 2)
- Produces (used by Task 4):
  - `type DataSource = 'loading' | 'live' | 'cached' | 'demo'`
  - `useDepartures(code)` now returns `{ departures: IDeparture[] | null; source: DataSource; cachedAt: number | null; retry: () => void }`
  - `cachedAt` is non-null only when `source === 'cached'`

- [ ] **Step 1: Replace the hook**

Replace the full contents of `app/_hooks/useDepartures.ts` with:

```ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { IDeparture } from '../interfaces/interfaces';
import { generateDepartures } from '../_utils/mock';
import { readCache, writeCache } from '../_utils/dataCache';
import appConfig from '@/config/app.config';

export type DataSource = 'loading' | 'live' | 'cached' | 'demo';

/**
 * Live departure board for a station: fetch on mount, poll every 60s,
 * refetch when the tab becomes visible. On failure, fall back to the
 * last live response cached in localStorage (max 1h old), then to demo
 * data. `source` reports which of those is showing, `cachedAt` is the
 * timestamp of cached data, and `retry` forces a fresh fetch.
 */
export function useDepartures(code: string | null | undefined): {
  departures: IDeparture[] | null;
  source: DataSource;
  cachedAt: number | null;
  retry: () => void;
} {
  const [departures, setDepartures] = useState<IDeparture[] | null>(null);
  const [source, setSource] = useState<DataSource>('loading');
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!code) return;
    queueMicrotask(() => { setDepartures(null); setSource('loading'); setCachedAt(null); });
    let active = true;
    let abortCtrl: AbortController | null = null;
    let hasLiveData = false;

    const fetchData = async () => {
      if (!active || document.visibilityState !== 'visible') return;
      abortCtrl?.abort();
      const ctrl = new AbortController();
      abortCtrl = ctrl;
      try {
        const res = await fetch(`/api/departures/${code}`, { signal: ctrl.signal });
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            hasLiveData = true;
            writeCache(`departures:${code}`, data);
            setDepartures(data);
            setSource('live');
            setCachedAt(null);
            return;
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
      if (active && !hasLiveData) {
        const cached = readCache<IDeparture[]>(`departures:${code}`, appConfig.departuresCacheTtlMs);
        if (cached) {
          setDepartures(cached.data);
          setSource('cached');
          setCachedAt(cached.cachedAt);
        } else {
          setDepartures(generateDepartures(code, new Date()));
          setSource('demo');
          setCachedAt(null);
        }
      }
    };

    fetchData();
    const timer = setInterval(fetchData, 60_000);
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      abortCtrl?.abort();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [code, attempt]);

  const retry = useCallback(() => setAttempt(a => a + 1), []);

  return { departures, source, cachedAt, retry };
}
```

Behavior notes (unchanged semantics preserved deliberately):
- `hasLiveData` still prevents a later poll failure from downgrading live data already on screen.
- Fallback priority is now live → cached (≤1h) → demo.

- [ ] **Step 2: Verify types and tests**

Run: `npx tsc --noEmit && npm test`
Expected: `tsc` clean; all vitest tests pass. (The two consuming views still compile because they destructure only `departures`, `source`, `retry` — `cachedAt` is additive.)

- [ ] **Step 3: Commit**

```bash
git add app/_hooks/useDepartures.ts
git commit -m "$(cat <<'EOF'
feat: fall back to cached departures before demo data

useDepartures now writes successful responses to the data cache and,
on failure, serves cached data (max 1h old) with a new 'cached'
source and cachedAt timestamp before generating demo data.

PRO-29

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: DataSourceBanner and view wiring

**Files:**
- Create: `app/_components/shared/DataSourceBanner.tsx`
- Delete: `app/_components/shared/DemoDataBanner.tsx`
- Modify: `app/_components/views/StationView.tsx:11,124,156-161`
- Modify: `app/_components/views/RhythmView.tsx:11,33,89-94`

**Interfaces:**
- Consumes: `useDepartures` return shape from Task 3 (`source: DataSource`, `cachedAt: number | null`), `formatTime(value: string | Date): string` from `app/_utils/format.ts`
- Produces: `DataSourceBanner({ variant, cachedAt, onRetry })` with `variant: 'demo' | 'cached'`, `cachedAt?: number | null`

- [ ] **Step 1: Create the banner**

Create `app/_components/shared/DataSourceBanner.tsx` (visuals identical to the old `DemoDataBanner`):

```tsx
'use client';

import React from 'react';
import { formatTime } from '../../_utils/format';

interface DataSourceBannerProps {
  variant: 'demo' | 'cached';
  cachedAt?: number | null;
  onRetry: () => void;
}

export default function DataSourceBanner({ variant, cachedAt, onRetry }: DataSourceBannerProps) {
  const chip = variant === 'demo' ? 'DEMO DATA' : 'OFFLINE';
  const message = variant === 'demo'
    ? 'Live departures unavailable.'
    : `Showing data from ${cachedAt != null ? formatTime(new Date(cachedAt)) : 'earlier'}.`;

  return (
    <div role="status" style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', borderRadius: 12,
      background: 'var(--warn-tint)', border: '1px solid var(--warn-border)',
    }}>
      <span style={{
        padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800,
        letterSpacing: '0.06em', background: 'var(--warn-text)', color: 'var(--card)',
        flexShrink: 0,
      }}>
        {chip}
      </span>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--warn-text)' }}>
        {message}
      </span>
      <button onClick={onRetry} style={{
        padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
        background: 'transparent', border: '1px solid var(--warn-border)',
        color: 'var(--warn-text)', flexShrink: 0,
      }}>
        Retry
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Delete the old banner**

```bash
git rm app/_components/shared/DemoDataBanner.tsx
```

- [ ] **Step 3: Update StationView**

In `app/_components/views/StationView.tsx`:

Import (line 11): replace
```tsx
import DemoDataBanner from '../shared/DemoDataBanner';
```
with
```tsx
import DataSourceBanner from '../shared/DataSourceBanner';
```

Hook call (line 124): replace
```tsx
  const { departures, source, retry } = useDepartures(station?.code);
```
with
```tsx
  const { departures, source, cachedAt, retry } = useDepartures(station?.code);
```

Banner block (lines 156–161): replace
```tsx
      {/* Demo-data notice */}
      {source === 'demo' && (
        <div style={{ padding: '12px 18px 0' }}>
          <DemoDataBanner onRetry={retry} />
        </div>
      )}
```
with
```tsx
      {/* Stale/demo-data notice */}
      {(source === 'demo' || source === 'cached') && (
        <div style={{ padding: '12px 18px 0' }}>
          <DataSourceBanner variant={source} cachedAt={cachedAt} onRetry={retry} />
        </div>
      )}
```

- [ ] **Step 4: Update RhythmView**

In `app/_components/views/RhythmView.tsx`:

Import (line 11): replace
```tsx
import DemoDataBanner from '../shared/DemoDataBanner';
```
with
```tsx
import DataSourceBanner from '../shared/DataSourceBanner';
```

Hook call (line 33): replace
```tsx
  const { departures, source, retry } = useDepartures(home.code);
```
with
```tsx
  const { departures, source, cachedAt, retry } = useDepartures(home.code);
```

Banner block (lines 89–94): replace
```tsx
      {/* Demo-data notice */}
      {source === 'demo' && (
        <div style={{ padding: '0 18px 12px' }}>
          <DemoDataBanner onRetry={retry} />
        </div>
      )}
```
with
```tsx
      {/* Stale/demo-data notice */}
      {(source === 'demo' || source === 'cached') && (
        <div style={{ padding: '0 18px 12px' }}>
          <DataSourceBanner variant={source} cachedAt={cachedAt} onRetry={retry} />
        </div>
      )}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean. Also confirm no remaining references: `grep -r "DemoDataBanner" app/` → no matches.

- [ ] **Step 6: Commit**

```bash
git add app/_components/shared/DataSourceBanner.tsx app/_components/views/StationView.tsx app/_components/views/RhythmView.tsx
git commit -m "$(cat <<'EOF'
feat: show offline banner with timestamp for cached departures

Generalize DemoDataBanner into DataSourceBanner with demo/cached
variants; views render it for both stale sources.

PRO-29

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Service worker and registration

**Files:**
- Create: `public/sw.js`
- Create: `app/_lib/RegisterSW.tsx`
- Modify: `app/layout.tsx:6,42`

**Interfaces:**
- Consumes: icons in `public/favicon/` (Task 1) for the `/favicon/*` cache-first route
- Produces: `/sw.js` served from origin root (scope `/`); `RegisterSW` client component rendered in the root layout

- [ ] **Step 1: Create the service worker**

Create `public/sw.js`:

```js
/*
 * App-shell service worker. Data (/api/*) is intentionally NOT cached
 * here — useDepartures caches data in localStorage so the UI can tell
 * live from stale. Bump CACHE_NAME on breaking SW changes.
 */
const CACHE_NAME = 'transit-v1';
const PRECACHE_URLS = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Content-hashed build assets and icons: cache-first.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/favicon/')) {
    event.respondWith(
      caches.match(request).then((hit) =>
        hit ?? fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        })
      )
    );
    return;
  }

  // Navigations: network-first, cached page then shell as fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match('/')) ?? Response.error())
    );
  }
  // Everything else (including /api/*) falls through to the network.
});
```

- [ ] **Step 2: Create the registration component**

Create `app/_lib/RegisterSW.tsx`:

```tsx
'use client';

import { useEffect } from 'react';

/** Registers the app-shell service worker. Production-only so dev never fights stale caches. */
export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); };
    if (document.readyState === 'complete') {
      register();
      return;
    }
    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
```

- [ ] **Step 3: Render it in the root layout**

In `app/layout.tsx`, add after the `SkipNav` import (line 6):

```tsx
import RegisterSW from './_lib/RegisterSW';
```

and in the body, add `<RegisterSW />` after `<WebVitals />` (line 42):

```tsx
        <AnalyticsWrapper />
        <WebVitals />
        <RegisterSW />
```

- [ ] **Step 4: Verify production build and manual smoke test**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: build succeeds.

Manual check (documented for the reviewer; run if a browser is available):
1. `npm run start`, open `http://localhost:3000` in Chrome.
2. DevTools → Application → Service Workers: `sw.js` activated; Manifest: installable, no icon errors.
3. Reload once (populates asset cache), then Network → Offline → reload: shell renders, board shows cached departures with the OFFLINE banner (or demo banner if cache empty).

- [ ] **Step 5: Commit**

```bash
git add public/sw.js app/_lib/RegisterSW.tsx app/layout.tsx
git commit -m "$(cat <<'EOF'
feat: add app-shell service worker

Cache-first for hashed static assets and icons, network-first for
navigations with offline shell fallback; registered in production
only. API routes are never cached by the SW.

PRO-29

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Remove next-pwa and final verification

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)

**Interfaces:**
- Consumes: nothing — `next-pwa` was never imported anywhere (`grep -r "next-pwa" app/ config/ next.config.ts` returns nothing)
- Produces: clean dependency tree for the PR

- [ ] **Step 1: Confirm next-pwa is unused, then remove it**

```bash
grep -rn "next-pwa" app/ config/ types/ next.config.ts || echo "unused, safe to remove"
npm uninstall next-pwa
```

Expected: "unused, safe to remove", then `package.json` no longer lists `next-pwa`.

- [ ] **Step 2: Full verification suite**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: everything green.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "$(cat <<'EOF'
chore: remove unused next-pwa dependency

The PWA uses a hand-rolled service worker; next-pwa was never wired
into next.config.ts and is unmaintained.

PRO-29

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: PR and Linear state

**Files:** none (process task)

**Interfaces:**
- Consumes: all previous commits on `julianaijal/pro-29-pwa-offline`
- Produces: open PR linked to PRO-29; PRO-29 in **In Review** (state id `8a623c27-bd43-4a20-8b9e-8c0d7167f736`)

- [ ] **Step 1: Push and open the PR**

```bash
git push -u origin julianaijal/pro-29-pwa-offline
gh pr create --title "Make app an installable PWA with offline cached data" --body "$(cat <<'EOF'
## Summary
- Real 192/512/maskable icons generated from favicon.ico; manifest theme colors aligned with the viewport
- Hand-rolled app-shell service worker: cache-first hashed assets, network-first navigations with offline fallback, production-only registration; /api/* never cached by the SW
- useDepartures falls back to localStorage-cached departures (1h TTL) with a new 'cached' source before demo data
- DemoDataBanner generalized to DataSourceBanner with an OFFLINE variant showing the data timestamp
- Removed unused next-pwa dependency

Fixes PRO-29

## Test plan
- [ ] `npm test` — dataCache unit tests green
- [ ] `npm run build && npm run start` — Lighthouse: installable, SW active
- [ ] DevTools offline reload after one visit: shell renders, OFFLINE banner with timestamp on the board

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 2: Move PRO-29 to In Review**

```bash
export $(grep -E "LINEAR_API_KEY" .env | xargs)
jq -n '{query:"mutation { issueUpdate(id: \"f1a06425-9601-4930-8520-817e464da51a\", input: { stateId: \"8a623c27-bd43-4a20-8b9e-8c0d7167f736\" }) { success issue { identifier state { name } } } }"}' \
  | curl -s https://api.linear.app/graphql -H "Authorization: $LINEAR_API_KEY" -H "Content-Type: application/json" --data @-
```

Expected: `{"data":{"issueUpdate":{"success":true,...In Review...}}}`

- [ ] **Step 3: Report the PR URL to the user**
