# JourneyView Real Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace JourneyView's fabricated data (hardcoded stops, random crowding, fake delay story) with real NS journey data via a new `/api/journey/[trainId]` route, and respect `tweaks.verbosity`. (Linear: PRO-11)

**Architecture:** A new Next.js route handler mirrors the existing departures route (rate limit → validate → NS fetch with `revalidate: 60` → slim mapped JSON). JourneyView fetches it client-side when the selected train has a numeric `trainId`, and `onOpenJourney` gains an optional `fromCode` so the timeline can mark the boarding station.

**Tech Stack:** Next.js 16 (App Router), TypeScript 5, Vitest (node env, explicit imports), NS Reisinformatie API, Linear GraphQL API, `gh` CLI.

**Spec:** `docs/superpowers/specs/2026-06-11-journeyview-real-data-design.md`

---

### Task 1: Branch + Linear state

- [ ] **Step 1: Create the branch from up-to-date master**

```bash
git checkout master && git pull
git checkout -b julianaijal/pro-11-journeyview-real-data
```

- [ ] **Step 2: Move PRO-11 to In Progress**

```bash
export $(grep -E '^LINEAR_API_KEY=' .env | xargs)
# Find the issue UUID and the "In Progress" state id
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" -H "Content-Type: application/json" \
  -d '{"query":"query { issue(id: \"PRO-11\") { id team { states { nodes { id name type } } } } }"}'
```

From the response, note the issue `id` (UUID) and the state node with `"type": "started"` (name "In Progress"). Then:

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" -H "Content-Type: application/json" \
  -d '{"query":"mutation { issueUpdate(id: \"<ISSUE_UUID>\", input: { stateId: \"<IN_PROGRESS_STATE_ID>\" }) { success } }"}'
```

Expected: `{"data":{"issueUpdate":{"success":true}}}`.

---

### Task 2: Journey API route (TDD)

`GET /api/journey/[trainId]` wraps NS `/reisinformatie-api/api/v2/journey?train={trainId}`. NS returns `payload.stops[]`; each stop has an `id` like `"asd_0"`, a `stop: { name }`, a `status` (`ORIGIN`/`STOP`/`PASSING`/`DESTINATION`), and `arrivals[]`/`departures[]` event arrays with `plannedTime`, `actualTime`, `plannedTrack`, `actualTrack`. The route filters out `PASSING` stops and stops without any timing event, and maps the rest to `IStop[]`.

**Files:**
- Modify: `app/interfaces/interfaces.tsx` (add `IStop`)
- Create: `app/api/journey/[trainId]/route.ts`
- Test: `app/api/journey/[trainId]/route.test.ts`

- [ ] **Step 1: Add the `IStop` interface**

In `app/interfaces/interfaces.tsx`, after the `IStation` interface (line 7), add:

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

- [ ] **Step 2: Write the failing tests**

Create `app/api/journey/[trainId]/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("../../../_lib/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ allowed: true })),
  getClientIp: vi.fn(() => "1.2.3.4"),
}));

import { GET } from "./route";
import { rateLimit } from "../../../_lib/rateLimit";

function callWithTrain(trainId: string) {
  return GET(new NextRequest("http://localhost/api/journey/1234"), {
    params: Promise.resolve({ trainId }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockReturnValue({ allowed: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/journey/[trainId]", () => {
  it("returns 429 when rate limited", async () => {
    vi.mocked(rateLimit).mockReturnValue({ allowed: false });

    const res = await callWithTrain("1234");

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "Too many requests" });
  });

  it("returns 400 for a non-numeric train number", async () => {
    const res = await callWithTrain("t3001");

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid train number" });
  });

  it("returns 400 for a too-long train number", async () => {
    const res = await callWithTrain("1234567"); // 7 digits, max is 6

    expect(res.status).toBe(400);
  });

  it("maps NS stops, filtering PASSING and event-less stops", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          payload: {
            stops: [
              {
                id: "asd_0",
                stop: { name: "Amsterdam Centraal" },
                status: "ORIGIN",
                arrivals: [],
                departures: [
                  {
                    plannedTime: "2026-06-11T08:14:00+02:00",
                    actualTime: "2026-06-11T08:16:00+02:00",
                    plannedTrack: "5",
                    actualTrack: "5",
                  },
                ],
              },
              {
                id: "dvd_0",
                stop: { name: "Duivendrecht" },
                status: "PASSING",
                arrivals: [],
                departures: [],
              },
              {
                id: "shl_0",
                stop: { name: "Schiphol Airport" },
                status: "STOP",
                arrivals: [
                  {
                    plannedTime: "2026-06-11T08:27:00+02:00",
                    plannedTrack: "3",
                  },
                ],
                departures: [
                  {
                    plannedTime: "2026-06-11T08:28:00+02:00",
                    plannedTrack: "3",
                    actualTrack: "4",
                  },
                ],
              },
              {
                id: "rtd_0",
                stop: { name: "Rotterdam Centraal" },
                status: "DESTINATION",
                arrivals: [
                  {
                    plannedTime: "2026-06-11T09:12:00+02:00",
                    actualTime: "2026-06-11T09:14:00+02:00",
                    plannedTrack: "15",
                  },
                ],
                departures: [],
              },
            ],
          },
        }),
      })
    );

    const res = await callWithTrain("1234");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([
      {
        code: "ASD",
        name: "Amsterdam Centraal",
        plannedTime: "2026-06-11T08:14:00+02:00",
        actualTime: "2026-06-11T08:16:00+02:00",
        track: "5",
        status: "ORIGIN",
      },
      {
        code: "SHL",
        name: "Schiphol Airport",
        plannedTime: "2026-06-11T08:28:00+02:00",
        actualTime: "2026-06-11T08:28:00+02:00",
        track: "4",
        status: "STOP",
      },
      {
        code: "RTD",
        name: "Rotterdam Centraal",
        plannedTime: "2026-06-11T09:12:00+02:00",
        actualTime: "2026-06-11T09:14:00+02:00",
        track: "15",
        status: "DESTINATION",
      },
    ]);
  });

  it("passes through a non-ok NS status with an empty body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502 }));

    const res = await callWithTrain("1234");

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual([]);
  });

  it("returns 500 with an empty body when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const res = await callWithTrain("1234");

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- "app/api/journey/[trainId]/route.test.ts"`
Expected: FAIL — cannot resolve `./route` (the route file does not exist yet).

- [ ] **Step 4: Implement the route**

Create `app/api/journey/[trainId]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { IStop } from '../../../interfaces/interfaces';
import { rateLimit, getClientIp } from '../../../_lib/rateLimit';

const BASE_URL = 'https://gateway.apiportal.ns.nl';
const API_KEY = process.env.NS_API ?? '';
const TRAIN_RE = /^\d{1,6}$/;

interface NsJourneyEvent {
  plannedTime?: string;
  actualTime?: string;
  plannedTrack?: string;
  actualTrack?: string;
}

interface NsJourneyStop {
  id: string;
  stop: { name: string };
  status: string;
  arrivals?: NsJourneyEvent[];
  departures?: NsJourneyEvent[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trainId: string }> }
) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { trainId } = await params;
  if (!TRAIN_RE.test(trainId)) {
    return NextResponse.json({ error: 'Invalid train number' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${BASE_URL}/reisinformatie-api/api/v2/journey?train=${encodeURIComponent(trainId)}`,
      {
        headers: { 'Ocp-Apim-Subscription-Key': API_KEY },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return NextResponse.json([], { status: res.status });
    }

    const data = await res.json();
    const raw: NsJourneyStop[] = data.payload?.stops ?? [];

    const stops: IStop[] = [];
    for (const s of raw) {
      if (s.status === 'PASSING') continue;
      const event = s.departures?.[0] ?? s.arrivals?.[0];
      if (!event?.plannedTime) continue;

      stops.push({
        code: s.id.split('_')[0].toUpperCase(),
        name: s.stop.name,
        plannedTime: event.plannedTime,
        actualTime: event.actualTime ?? event.plannedTime,
        track: event.actualTrack ?? event.plannedTrack ?? '',
        status:
          s.status === 'ORIGIN' || s.status === 'DESTINATION'
            ? s.status
            : 'STOP',
      });
    }

    return NextResponse.json(stops);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- "app/api/journey/[trainId]/route.test.ts"`
Expected: 6 tests PASS.

- [ ] **Step 6: Run the full gate**

Run: `npm run lint && npm test && npm run build`
Expected: all pass (23 existing tests + 6 new).

- [ ] **Step 7: Commit**

```bash
git add app/interfaces/interfaces.tsx "app/api/journey/[trainId]/route.ts" "app/api/journey/[trainId]/route.test.ts"
git commit -m "$(cat <<'EOF'
feat: add journey stops API route

Wraps NS /api/v2/journey?train=... behind rate limiting and maps
payload.stops to a slim IStop[], filtering PASSING stops.

PRO-11
EOF
)"
```

---

### Task 3: Rework JourneyView

Replace the entire file: real stops fetched from the new route, no hardcoded `STOPS`, no `Math.random()` crowding fallback (the Platform choreography card only renders when `train.crowding` exists), no fabricated "Why you're late" card or `Spark` sparkline, no `'3523'` train-number fallback, and `tweaks.verbosity === 'minimal'` hides the `CrowdingStrip`. The view accepts an optional `fromCode` prop to mark the boarding station ("here") in the timeline; page.tsx starts passing it in Task 4 (the prop is optional, so this task builds on its own).

**Files:**
- Modify: `app/_components/views/JourneyView.tsx` (full rewrite)

- [ ] **Step 1: Replace `app/_components/views/JourneyView.tsx` with:**

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { IDeparture, IStop, ITweaks } from '../../interfaces/interfaces';
import { IconBack } from '../icons/Icons';
import CrowdingStrip from '../shared/CrowdingStrip';
import Loader from '../_partials/Loader';

interface JourneyViewProps {
  train: IDeparture | null;
  fromCode?: string;
  tweaks: ITweaks;
  onBack: () => void;
}

function quietestIdx(crowding: number[]): number {
  let min = 1, idx = 0;
  crowding.forEach((c, i) => { if (c < min) { min = c; idx = i; } });
  return idx;
}

export default function JourneyView({ train, fromCode, tweaks, onBack }: JourneyViewProps) {
  const [stops, setStops] = useState<IStop[] | null>(null);
  const [stopsFailed, setStopsFailed] = useState(false);

  const rawTrainId = train?.trainId;
  const trainId =
    rawTrainId != null && /^\d+$/.test(String(rawTrainId)) ? String(rawTrainId) : null;

  useEffect(() => {
    setStops(null);
    setStopsFailed(!trainId);
    if (!trainId) return;

    let active = true;
    const ctrl = new AbortController();
    fetch(`/api/journey/${trainId}`, { signal: ctrl.signal })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) setStops(data);
        else setStopsFailed(true);
      })
      .catch(err => {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (active) setStopsFailed(true);
      });

    return () => { active = false; ctrl.abort(); };
  }, [trainId]);

  if (!train) return null;

  const hereIdx = stops && fromCode ? stops.findIndex(s => s.code === fromCode) : -1;
  const originName = stops ? (hereIdx >= 0 ? stops[hereIdx].name : stops[0].name) : null;
  const crowding = train.crowding;
  const actual = new Date(train.actualDateTime);

  return (
    <div className="view fade-up">
      {/* Header */}
      <div style={{ padding: '18px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ padding: '6px 0', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconBack aria-hidden="true" style={{ width: 18, height: 18 }} />
          <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Back</span>
        </button>
        <span className="now-pill"><span className="dot live" /> tracking</span>
      </div>

      {/* Big headline */}
      <div style={{ padding: '6px 20px 20px' }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          {train.trainCategory}{train.trainId ? ` · TRAIN ${train.trainId}` : ''}
        </div>
        <h1 className="serif" style={{ fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          {originName && (
            <>
              <em style={{ fontStyle: 'italic' }}>{originName}</em>
              <span style={{ color: 'var(--ink-3)' }}> → </span>
            </>
          )}
          <em style={{ fontStyle: 'italic' }}>{train.direction}</em>
        </h1>
        <div style={{ marginTop: 10, display: 'flex', gap: 14, alignItems: 'baseline' }}>
          <div className="serif num" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
            {actual.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="mono" style={{ fontSize: 12, color: train.delayMinutes > 0 ? 'var(--accent)' : 'var(--ok-text)' }}>
            {train.delayMinutes > 0 ? `+${train.delayMinutes} min` : 'on time'}
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            TRACK {train.actualTrack}
          </div>
        </div>
      </div>

      {/* Platform choreography — only when real crowding data exists */}
      {crowding && crowding.length > 0 && (
        <PlatformCard crowding={crowding} train={train} tweaks={tweaks} />
      )}

      {/* Timeline */}
      <div style={{ padding: '24px 20px 0' }}>
        <h2 className="eyebrow" style={{ marginBottom: 12 }}>
          Journey timeline{stops ? ` · ${stops.length} stops` : ''}
        </h2>
        {stops ? (
          <ol style={{ position: 'relative', listStyle: 'none', padding: 0, margin: 0 }}>
            {stops.map((s, i) => (
              <li key={`${s.code}-${i}`}>
                <StopRow stop={s} here={i === hereIdx} last={i === stops.length - 1} />
              </li>
            ))}
          </ol>
        ) : stopsFailed ? (
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            Stops unavailable
          </div>
        ) : (
          <Loader />
        )}
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}

function PlatformCard({ crowding, train, tweaks }: {
  crowding: number[];
  train: IDeparture;
  tweaks: ITweaks;
}) {
  const quietest = quietestIdx(crowding);
  return (
    <div style={{ padding: '0 20px 4px' }}>
      <h2 className="eyebrow" style={{ marginBottom: 10 }}>Platform choreography</h2>
      <div className="card" style={{ padding: 16 }}>
        <div className="serif" style={{ fontSize: 18, lineHeight: 1.3 }}>
          Stand at the <em>{quietest < crowding.length / 2 ? 'front' : 'back'}</em> of Track {train.actualTrack}.
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.45 }}>
          Car <strong>{quietest + 1}</strong> is quietest right now. It&apos;ll stop near the{' '}
          <strong>{quietest < crowding.length / 2 ? 'north' : 'south'}</strong> end of the platform.
        </div>

        <div aria-hidden="true" style={{ marginTop: 16 }}>
          <PlatformDiagram
            crowding={crowding}
            highlight={quietest}
            quietCar={train.quietCarriage ?? null}
            firstClass={train.firstClassCars ?? []}
          />
        </div>

        {tweaks.verbosity === 'rich' && (
          <div style={{ marginTop: 14 }}>
            <CrowdingStrip crowding={crowding} style={tweaks.crowdingStyle} />
          </div>
        )}
      </div>
    </div>
  );
}

function PlatformDiagram({ crowding, highlight, quietCar, firstClass }: {
  crowding: number[];
  highlight: number;
  quietCar: number | null;
  firstClass: number[];
}) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 4 }}>
        {crowding.map((_, i) => {
          const isFirst = firstClass.includes(i);
          const isQuiet = quietCar === i;
          const isHi = highlight === i;
          return (
            <div key={i} style={{
              flex: 1, height: 44, borderRadius: 5,
              background: isHi ? 'var(--ink)' : 'var(--bg-3)',
              color: isHi ? 'var(--bg)' : 'var(--ink-2)',
              border: `1px solid ${isHi ? 'var(--ink)' : 'var(--line)'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              position: 'relative', fontSize: 10,
            }}>
              <span className="mono" style={{ fontSize: 10, fontWeight: 600 }}>{i + 1}</span>
              {isFirst && <span className="mono" style={{ fontSize: 8, opacity: 0.6 }}>1ST</span>}
              {isQuiet && !isFirst && <span className="mono" style={{ fontSize: 8, opacity: 0.6 }}>QUIET</span>}
              {isHi && (
                <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: 12 }}>↓</div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>← FRONT · North end</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>South end · BACK →</span>
      </div>
    </div>
  );
}

function StopRow({ stop, here, last }: { stop: IStop; here: boolean; last: boolean }) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const delayed = new Date(stop.actualTime).getTime() !== new Date(stop.plannedTime).getTime();
  const destination = stop.status === 'DESTINATION';

  return (
    <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
      <div style={{ width: 60, textAlign: 'right', paddingTop: 8 }}>
        <div className="mono num" style={{ fontSize: 13, fontWeight: 500 }}>{fmt(stop.actualTime)}</div>
        {delayed && (
          <div className="mono num" style={{ fontSize: 10.5, color: 'var(--ink-3)', textDecoration: 'line-through' }}>{fmt(stop.plannedTime)}</div>
        )}
      </div>

      <div style={{ position: 'relative', width: 18, flexShrink: 0 }}>
        <div style={{ position: 'absolute', left: 8, top: 0, bottom: last ? '50%' : 0, width: 1.5, background: 'var(--line)' }} />
        <div style={{
          position: 'absolute', left: 4, top: 10,
          width: 10, height: 10, borderRadius: '50%',
          background: here ? 'var(--accent)' : 'var(--bg)',
          border: `1.5px solid ${here || destination ? 'var(--ink)' : 'var(--ink-3)'}`,
          boxShadow: here ? '0 0 0 4px var(--accent-dim)' : 'none',
        }} />
      </div>

      <div style={{ flex: 1, padding: '6px 0 18px' }}>
        <div className="serif" style={{
          fontSize: here || destination ? 18 : 16,
          lineHeight: 1.2,
          fontStyle: here ? 'italic' : 'normal',
          color: here ? 'var(--accent)' : 'var(--ink)',
        }}>
          {stop.name}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{stop.code}</span>
          {stop.track && (
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>· TRACK {stop.track}</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

Deleted relative to the old file: the `STOPS` array, the `fallbackCrowding` state, the local `Stop` interface, the "Why you're late" card, and the `Spark` component.

- [ ] **Step 2: Run the gate**

Run: `npm run lint && npm test && npm run build`
Expected: all pass.

- [ ] **Step 3: Manual smoke test**

Run `npm run dev`, open the app, click a departure in Rhythm. Expected: headline shows immediately, loader appears in the timeline area, then real stops render (origin → destination of the actual train). No Platform choreography card (no crowding data). No "Why you're late" card.

- [ ] **Step 4: Commit**

```bash
git add app/_components/views/JourneyView.tsx
git commit -m "$(cat <<'EOF'
feat: show real journey stops in JourneyView

Fetches /api/journey/[trainId] instead of the hardcoded ASD-RTD stops.
Removes the Math.random() crowding fallback (choreography card now only
renders with real crowding data), the fabricated "Why you're late" card,
and respects tweaks.verbosity for the crowding strip.

PRO-11
EOF
)"
```

---

### Task 4: Wire `fromCode` through callers; drop PulseView's fake crowding

`onOpenJourney` gains an optional `fromCode`. RhythmView boards at `'ASD'` (its departures are fetched from `/api/departures/ASD`), StationView at `station.code`, PulseView passes nothing. PulseView also stops injecting `Math.random()` crowding into the journey it constructs.

**Files:**
- Modify: `app/page.tsx:52,79,94`
- Modify: `app/_components/views/RhythmView.tsx:12,118,136`
- Modify: `app/_components/views/StationView.tsx:20,183`
- Modify: `app/_components/views/PulseView.tsx:292`

- [ ] **Step 1: page.tsx — journey state carries fromCode**

Replace line 52:

```tsx
  const [journey, setJourney]     = useState<IDeparture | null>(null);
```

with:

```tsx
  const [journey, setJourney]     = useState<{ train: IDeparture; fromCode?: string } | null>(null);
```

Replace line 79:

```tsx
  const openJourney = (train: IDeparture) => { setJourney(train); setTab('journey'); };
```

with:

```tsx
  const openJourney = (train: IDeparture, fromCode?: string) => { setJourney({ train, fromCode }); setTab('journey'); };
```

Replace line 94:

```tsx
  else if (tab === 'journey') content = <JourneyView train={journey} tweaks={tweaks} onBack={() => setTab('rhythm')} />;
```

with:

```tsx
  else if (tab === 'journey') content = <JourneyView train={journey?.train ?? null} fromCode={journey?.fromCode} tweaks={tweaks} onBack={() => setTab('rhythm')} />;
```

- [ ] **Step 2: RhythmView — pass 'ASD'**

Line 12, replace:

```tsx
  onOpenJourney: (train: IDeparture) => void;
```

with:

```tsx
  onOpenJourney: (train: IDeparture, fromCode?: string) => void;
```

Line 118, replace `onClick={() => onOpenJourney(yourTrain)}` with `onClick={() => onOpenJourney(yourTrain, 'ASD')}`.

Line 136, replace:

```tsx
          <LaterToday departures={departures} onOpen={onOpenJourney} tweaks={tweaks} />
```

with:

```tsx
          <LaterToday departures={departures} onOpen={d => onOpenJourney(d, 'ASD')} tweaks={tweaks} />
```

- [ ] **Step 3: StationView — pass station.code**

Line 20, replace:

```tsx
  onOpenJourney: (train: IDeparture) => void;
```

with:

```tsx
  onOpenJourney: (train: IDeparture, fromCode?: string) => void;
```

Line 183, replace `onOpen={() => onOpenJourney(d)}` with `onOpen={() => onOpenJourney(d, station.code)}`.

- [ ] **Step 4: PulseView — remove the fabricated crowding**

In the `onOpenJourney({...})` call around line 282, delete this line:

```tsx
                  crowding: Array.from({ length: 6 }, () => Math.random()),
```

(`crowding` is optional on `IDeparture`; no other change needed. PulseView's prop type stays `(train: IDeparture) => void` — it never passes a fromCode.)

- [ ] **Step 5: Run the gate**

Run: `npm run lint && npm test && npm run build`
Expected: all pass.

- [ ] **Step 6: Manual smoke test**

`npm run dev`:
- Rhythm → click a departure: the boarding stop **Amsterdam Centraal** is highlighted ("here" dot, accent color) in the timeline; earlier stops of the train's route may appear above it.
- Search → pick another station → click a departure: that station is highlighted.
- Pulse → select a train on the map → "View journey": headline renders, timeline shows "Stops unavailable" (mock train ids are non-numeric), no choreography card.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx app/_components/views/RhythmView.tsx app/_components/views/StationView.tsx app/_components/views/PulseView.tsx
git commit -m "$(cat <<'EOF'
feat: pass boarding station to JourneyView

openJourney carries an optional fromCode so the timeline can mark the
"you are here" stop. Also removes PulseView's Math.random() crowding
injection.

PRO-11
EOF
)"
```

---

### Task 5: PR + Linear sync

- [ ] **Step 1: Push and open the PR**

```bash
git push -u origin julianaijal/pro-11-journeyview-real-data
gh pr create --title "feat: JourneyView real API data" --body "$(cat <<'EOF'
## Summary
- New rate-limited `/api/journey/[trainId]` route wrapping NS `/api/v2/journey`, mapped to a slim `IStop[]` (PASSING stops filtered)
- JourneyView fetches real stops (loader / "Stops unavailable" states); hardcoded ASD→RTD STOPS array deleted
- Math.random() crowding fallback removed — Platform choreography card only renders with real crowding data (PRO-5 will supply it); PulseView's injected random crowding removed too
- Fabricated "Why you're late" card and sparkline removed
- `tweaks.verbosity: minimal` hides the crowding strip
- `onOpenJourney(train, fromCode?)` marks the boarding station in the timeline

Fixes PRO-11

## Test plan
- [ ] CI passes (lint, 29 tests, build)
- [ ] Rhythm → departure: real stops load, ASD highlighted
- [ ] Search → station → departure: that station highlighted
- [ ] Pulse → map train → View journey: "Stops unavailable", no crash

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed. Report it to the user.

- [ ] **Step 2: Watch CI**

Run: `gh pr checks --watch`
Expected: the `ci` job passes.

- [ ] **Step 3: Verify Linear state**

```bash
export $(grep -E '^LINEAR_API_KEY=' .env | xargs)
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" -H "Content-Type: application/json" \
  -d '{"query":"query { issue(id: \"PRO-11\") { state { name } } }"}'
```

Expected: state "In Review" (webhook moves it when the PR opens). If it is still "In Progress", update it via `issueUpdate` with the team's `started`-type review state id (see Task 1 Step 2 for the states query).
