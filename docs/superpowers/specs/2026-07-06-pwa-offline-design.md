# PWA with Offline Cached Data — Design

**Date:** 2026-07-06
**Linear:** PRO-29
**Branch:** `julianaijal/pro-29-pwa-offline`

## Goal

Make the app an installable PWA that opens offline and shows the last-known
departures (clearly marked as stale) instead of failing straight to demo data.

## Current state

- `public/manifest.json` exists and is linked from `app/layout.tsx`, but
  `public/favicon/` is empty, so the referenced icons don't exist and the app
  is not installable.
- `next-pwa` is a dependency but is never used (`next.config.ts` doesn't wire
  it up). No service worker exists.
- `useDepartures` polls every 60s and falls back to generated demo data on
  fetch failure; `source` reports `'loading' | 'live' | 'demo'`.
- A strict CSP is set in `next.config.ts` (`default-src 'self'`).

## Decisions

| Decision | Choice |
|---|---|
| SW technology | Hand-rolled `public/sw.js`; remove unused `next-pwa` |
| Data caching layer | In `useDepartures` via `localStorage`, not in the SW |
| Journey caching | None — stale stops for a specific train are not useful (YAGNI) |
| Cache TTL | 1 hour; older entries treated as absent, fall through to demo |
| Stale-data UX | Banner with "OFFLINE" chip + "showing data from HH:MM" + Retry |
| Icons | Derived from the 256×256 frame in `app/favicon.ico` |

## 1. Manifest and icons

- Generate from `app/favicon.ico` (256×256 frame):
  - `public/favicon/icon-192.png` (downscale)
  - `public/favicon/icon-512.png` (2× upscale — acceptable for simple artwork)
  - `public/favicon/icon-512-maskable.png` (512px canvas, artwork scaled to
    ~80% with padding for the maskable safe zone)
- Update `public/manifest.json`:
  - add the maskable icon entry with `"purpose": "maskable"`
  - set `theme_color` to `#F2F4F8` to match the viewport `themeColor` in
    `app/layout.tsx`

## 2. Service worker

`public/sw.js`, plain JavaScript, no build step.

- Versioned cache name (e.g. `transit-v1`). Bump manually on breaking SW
  changes.
- `install`: pre-cache `/` (the shell) and `/manifest.json`; `skipWaiting()`.
- `activate`: delete caches with other names; `clients.claim()`.
- `fetch` routing:
  - `GET /_next/static/*` and `/favicon/*`: **cache-first** (content-hashed /
    immutable assets), populate cache on first fetch.
  - Navigations (`request.mode === 'navigate'`): **network-first**; on network
    failure serve the cached `/` shell.
  - `/api/*` and everything else: pass through untouched. Data caching is the
    hook's job so the UI always knows whether data is live or stale.

**Registration:** new `app/_lib/RegisterSW.tsx` (`'use client'`), rendered in
`app/layout.tsx`. Registers `/sw.js` in a `load` handler, only when
`process.env.NODE_ENV === 'production'`, so dev never fights stale caches.

**CSP:** no changes — `default-src 'self'` covers `worker-src` for a
same-origin SW.

**Dependency cleanup:** remove `next-pwa` from `package.json`.

**Known limitation:** without a build-time precache manifest, the offline
shell works from the second visit onward (assets are cached as they are first
fetched). Accepted trade-off of the no-dependency approach.

## 3. Data caching (departures only)

New `app/_utils/dataCache.ts`:

```ts
writeCache(key: string, data: unknown): void
readCache<T>(key: string, maxAgeMs: number): { data: T; cachedAt: number } | null
```

- Backed by `localStorage`, storing `{ data, cachedAt }` as JSON.
- All operations wrapped in try/catch (private mode, quota, corrupt JSON →
  behave as a miss; corrupt entries are removed).
- TTL constant `DEPARTURES_CACHE_TTL_MS = 1h` in `config/app.config.tsx`.

`app/_hooks/useDepartures.ts` changes:

- `DataSource` gains `'cached'`.
- Return shape gains `cachedAt: number | null` (non-null only when
  `source === 'cached'`).
- On successful live fetch: `writeCache('departures:' + code, data)`.
- On failure (non-OK, empty, or thrown): fallback order becomes
  **live → cached (≤1h) → demo**. Existing `hasLiveData` guard keeps a
  later poll failure from downgrading live data already on screen.

`useJourney` is intentionally unchanged.

## 4. Stale-data UX

- Rename/generalize `app/_components/shared/DemoDataBanner.tsx` to
  `DataSourceBanner.tsx` with props
  `{ variant: 'demo' | 'cached'; cachedAt?: number; onRetry: () => void }`:
  - `demo`: chip "DEMO DATA", text "Live departures unavailable." (as today)
  - `cached`: chip "OFFLINE", text "Showing data from HH:MM" (local time via
    `toLocaleTimeString`), same warn styling and Retry button.
- `StationView` and `RhythmView` render the banner when `source` is `'demo'`
  **or** `'cached'`, passing the variant and `cachedAt`.

## 5. Error handling summary

| Failure | Behavior |
|---|---|
| API down, cache fresh (≤1h) | Cached departures + OFFLINE banner with timestamp |
| API down, cache stale/absent | Demo data + DEMO DATA banner (unchanged) |
| `localStorage` unavailable/full | Cache silently disabled; behavior as today |
| Corrupt cache entry | Treated as miss and deleted |
| Offline navigation | SW serves cached shell; hooks then follow rows above |

## 6. Testing

Vitest (pattern per `app/_lib/rateLimit.test.ts`):

- `dataCache`: write/read roundtrip, TTL expiry, corrupt JSON → miss +
  cleanup, `localStorage` throwing → no crash.
- Fallback ordering (live → cached → demo) covered at the utility level; no
  component-testing library is installed and none will be added.
- Manual verification: `next build && next start`, Lighthouse PWA/installability
  check, DevTools offline-mode reload showing shell + cached data + banner.

## 7. Workflow

- Linear PRO-29 → In Progress at start, In Review at PR, `Fixes PRO-29` in PR
  body, `PRO-29` in commit message bodies.
- Small atomic commits: icons+manifest → SW+registration → cache util →
  hook changes → banner/UI → `next-pwa` removal.
