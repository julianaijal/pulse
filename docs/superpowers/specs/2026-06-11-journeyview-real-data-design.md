# JourneyView Real Data — Design

**Linear:** PRO-11 — "JourneyView: vervang mock-data door echte API-data"
**Date:** 2026-06-11

## Problem

JourneyView fabricates data three ways:

1. A hardcoded `STOPS` array (always ASD → RTD) regardless of the selected train (`JourneyView.tsx:14-22`).
2. A `Math.random()` crowding fallback that regenerates on every mount, so crowding bars change on each refresh (`JourneyView.tsx:31-33`). PulseView additionally injects random crowding when opening a journey from the map (`PulseView.tsx:292`).
3. `tweaks.verbosity` is ignored — the full detail view always renders.

Also fabricated: the "Why you're late" card invents a cause ("Duivendrecht") and a fake delay-trend sparkline.

## Decisions

- **No crowding data → no Platform choreography card.** The card (advice, diagram, strip) renders only when `train.crowding` exists. Real crowding integration is PRO-5; until then the card simply doesn't appear.
- **"Why you're late" card removed** entirely, including the `Spark` component. It may return later backed by the disruptions API.
- **Loading:** headline renders immediately from `IDeparture`; the timeline area shows the existing `Loader`. On failure (or when no usable `trainId` exists) the timeline area shows a muted "Stops unavailable" message. No mock fallback.
- **`verbosity: 'minimal'`** hides the `CrowdingStrip` inside the choreography card (when the card renders at all). Diagram and advice remain.

## Architecture

### New API route: `app/api/journey/[trainId]/route.ts`

Same skeleton as the departures route:

1. Rate limit via `rateLimit(getClientIp(req))` → 429 `{ error: 'Too many requests' }`.
2. Validate `trainId` against `/^\d{1,6}$/` → 400 `{ error: 'Invalid train number' }`.
3. Fetch `GET {BASE_URL}/reisinformatie-api/api/v2/journey?train={trainId}` with the `Ocp-Apim-Subscription-Key` header and `next: { revalidate: 60 }`.
4. Map `payload.stops[]` to `IStop[]`:
   - Skip entries with `status === 'PASSING'`.
   - `code`: derived from the NS stop `id` (format `"asd_0"` → `id.split('_')[0].toUpperCase()` → `"ASD"`); `name`: `stop.name`. The `fromCode` "here" match compares against this derived code.
   - Times from `departures[0]`, falling back to `arrivals[0]` (covers the destination, which has no departure).
   - `plannedTime` / `actualTime` (ISO strings; `actualTime` falls back to planned).
   - `track`: `actualTrack ?? plannedTrack ?? ''`.
   - `status`: `'ORIGIN' | 'STOP' | 'DESTINATION'`.
5. Non-ok NS response → `[]` with the NS status passed through. Thrown fetch → 500 `[]`.

### New interface (interfaces.tsx)

```ts
export interface IStop {
  code: string;
  name: string;
  plannedTime: string;   // ISO
  actualTime: string;    // ISO
  track: string;
  status: 'ORIGIN' | 'STOP' | 'DESTINATION';
}
```

Replaces JourneyView's local `Stop` interface.

### JourneyView changes

- Delete the hardcoded `STOPS` array and the `fallbackCrowding` state.
- Fetch `/api/journey/{trainId}` on mount / `trainId` change when `trainId` matches `/^\d+$/`, with `AbortController` (same pattern as StationView). No polling.
- `StopRow` renders `actualTime`, with `plannedTime` struck through when they differ; the old client-side `delayMinutes` arithmetic is deleted.
- Timeline marks the "you are here" stop by matching `fromCode` (see below); the headline's origin name uses that stop once loaded, falling back to the first stop.

### Origin station: explicit `fromCode`

The journey API returns the train's full route, which can start before the boarding station. `onOpenJourney` gains an optional second argument:

- Signature: `onOpenJourney(train: IDeparture, fromCode?: string)`.
- RhythmView passes `'ASD'`; StationView passes `station.code`; PulseView passes nothing (no "here" marker).
- `page.tsx` journey state becomes `{ train, fromCode }`; JourneyView receives `fromCode` as a prop.

Rejected alternative: parsing the station code from the `train.id` prefix — implicit contract that mock ids don't fully share.

### PulseView

Remove the inline `Math.random()` crowding from the journey it constructs (`PulseView.tsx:292`). Its mock trains have non-numeric ids (`t3001`), so JourneyView shows the "Stops unavailable" state for them — acceptable until PRO-4 brings real live data to PulseView.

### Out of scope

- `mock.ts generateDepartures` keeps its crowding values — it is the app's deliberate offline/demo fallback (real crowding is PRO-5).
- Live PulseView data (PRO-4), real crowding (PRO-5).

## Testing

`app/api/journey/[trainId]/route.test.ts` (Vitest, node env, NS API stubbed via `vi.stubGlobal('fetch', ...)`, rate limiter module-mocked — same style as sibling route tests):

- 429 when rate-limited.
- 400 for a non-numeric / too-long train number.
- Maps stops: PASSING filtered out, times from departures with arrival fallback at the destination, track fallback, status preserved.
- Non-ok NS response passes the status through with `[]`.
- 500 with `[]` when fetch throws.

No component tests — the testing foundation covers pure logic only.

## Delivery

- Branch `julianaijal/pro-11-journeyview-real-data`; PRO-11 → In Progress at start, In Review when the PR opens.
- Small atomic commits, each with `PRO-11` in the body; PR body contains `Fixes PRO-11`.
- Gate: `npm run lint && npm test && npm run build` locally; CI enforces the same.
