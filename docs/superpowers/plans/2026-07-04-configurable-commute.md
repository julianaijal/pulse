# Configurable Commute Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users configure their home and work stations so RhythmView fetches real departures for their actual commute instead of the hardcoded ASD → UT route.

**Architecture:** A new `StationPicker` component handles inline station search inside TweaksPanel. page.tsx manages commute state (localStorage-persisted) and passes home/work stations down to RhythmView and TweaksPanel. RhythmView replaces all hardcoded ASD/UT references with the configured stations. No new API routes — uses the existing `/api/departures/[code]` and `/api/stations` endpoints.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, localStorage. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-04-configurable-commute-design.md`

**Linear state ids (team Product):** In Progress `cf7f41bb-2042-4d1c-98dc-7088e887c5e2`, In Review `8a623c27-bd43-4a20-8b9e-8c0d7167f736`.

---

### Task 1: Branch + Linear issue

- [ ] **Step 1: Create the Linear issue**

```bash
source .env
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" -H "Content-Type: application/json" \
  -d "{\"query\": \"mutation(\$input: IssueCreateInput!) { issueCreate(input: \$input) { issue { identifier url } } }\", \"variables\": {\"input\": {\"teamId\": \"$LINEAR_TEAM_ID\", \"title\": \"Configurable commute (home/work station picker)\", \"description\": \"Let users set their home and work stations in the Tweaks panel. RhythmView fetches departures for the configured home station and matches trains toward the configured work station. Persists via localStorage.\", \"stateId\": \"cf7f41bb-2042-4d1c-98dc-7088e887c5e2\"}}}"
```

Expected: JSON containing `"identifier": "PRO-<N>"`. Note this number — all commit messages reference it as `PRO-<N>` and the PR body uses `Fixes PRO-<N>`.

If the Linear API key is expired/invalid, skip this step — create the issue manually in Linear and note the number.

- [ ] **Step 2: Create the branch from up-to-date master**

```bash
git checkout master && git pull && git checkout -b julianaijal/pro-<N>-configurable-commute
```

Expected: `Switched to a new branch 'julianaijal/pro-<N>-configurable-commute'`

---

### Task 2: CommuteStation interface + commute state in page.tsx

**Files:**
- Modify: `app/interfaces/interfaces.tsx` (add `CommuteStation`)
- Modify: `app/page.tsx` (add commute state, hydration, persistence helper, wire to RhythmView and TweaksPanel props)
- Modify: `app/_components/TweaksPanel.tsx` (accept new commute props, pass through for now)
- Modify: `app/_components/views/RhythmView.tsx` (accept new props, use them)

This task wires the full data flow end-to-end. TweaksPanel accepts the new props but doesn't render the commute UI yet (Task 3 adds StationPicker, Task 4 adds the commute section). RhythmView switches from hardcoded ASD/UT to the configured stations.

- [ ] **Step 1: Add `CommuteStation` to interfaces**

In `app/interfaces/interfaces.tsx`, after the `IStation` interface (after line 7), add:

```ts
export interface CommuteStation {
  code: string;
  name: string;
}
```

- [ ] **Step 2: Update page.tsx — add commute state, hydration, persistence, and wiring**

In `app/page.tsx`, add the import for `CommuteStation`:

Replace:

```tsx
import { IDeparture, ITweaks } from './interfaces/interfaces';
```

with:

```tsx
import { IDeparture, ITweaks, CommuteStation } from './interfaces/interfaces';
```

Add commute state after line 54 (`const [showTweaks, setShowTweaks] = useState(false);`):

```tsx
  const [commute, setCommute]     = useState<{ home: CommuteStation | null; work: CommuteStation | null }>({ home: null, work: null });
```

In the existing hydration `useEffect` (lines 57–65), add commute loading after the tab restoration. Replace:

```tsx
  useEffect(() => {
    queueMicrotask(() => {
      setTweaks(loadTweaks());
      const saved = localStorage.getItem('pulse.tab') as Tab | null;
      if (saved && ['rhythm', 'pulse', 'journey', 'station', 'search'].includes(saved)) {
        setTab(saved);
      }
    });
  }, []);
```

with:

```tsx
  useEffect(() => {
    queueMicrotask(() => {
      setTweaks(loadTweaks());
      const saved = localStorage.getItem('pulse.tab') as Tab | null;
      if (saved && ['rhythm', 'pulse', 'journey', 'station', 'search'].includes(saved)) {
        setTab(saved);
      }
      const parseStation = (key: string): CommuteStation | null => {
        try { return JSON.parse(localStorage.getItem(key) ?? ''); }
        catch { return null; }
      };
      setCommute({
        home: parseStation('pulse.homeStation') ?? { code: 'ASD', name: 'Amsterdam Centraal' },
        work: parseStation('pulse.workStation') ?? { code: 'UT', name: 'Utrecht Centraal' },
      });
    });
  }, []);
```

Add the persistence helper after `updateTweak` (after line 77):

```tsx
  const setCommuteStation = (key: 'home' | 'work', station: CommuteStation) => {
    setCommute(c => ({ ...c, [key]: station }));
    localStorage.setItem(key === 'home' ? 'pulse.homeStation' : 'pulse.workStation', JSON.stringify(station));
  };
```

Update the RhythmView render to pass homeStation and workStation. Replace:

```tsx
  if      (tab === 'rhythm')  content = <RhythmView  tweaks={tweaks} onOpenJourney={openJourney} onOpenStation={openStation} />;
```

with:

```tsx
  if      (tab === 'rhythm')  content = <RhythmView  tweaks={tweaks} homeStation={commute.home} workStation={commute.work} onOpenJourney={openJourney} onOpenStation={openStation} />;
```

Update the TweaksPanel render to pass commute props. Replace:

```tsx
        <TweaksPanel tweaks={tweaks} onChange={updateTweak} onClose={() => setShowTweaks(false)} />
```

with:

```tsx
        <TweaksPanel tweaks={tweaks} onChange={updateTweak} commute={commute} onCommuteChange={setCommuteStation} onClose={() => setShowTweaks(false)} />
```

- [ ] **Step 3: Update TweaksPanel to accept (but not yet render) commute props**

In `app/_components/TweaksPanel.tsx`, add the import:

Replace:

```tsx
import { ITweaks } from '../interfaces/interfaces';
```

with:

```tsx
import { ITweaks, CommuteStation } from '../interfaces/interfaces';
```

Update the props interface. Replace:

```tsx
interface TweaksPanelProps {
  tweaks: ITweaks;
  onChange: (key: keyof ITweaks, value: string) => void;
  onClose: () => void;
}
```

with:

```tsx
interface TweaksPanelProps {
  tweaks: ITweaks;
  onChange: (key: keyof ITweaks, value: string) => void;
  commute: { home: CommuteStation | null; work: CommuteStation | null };
  onCommuteChange: (key: 'home' | 'work', station: CommuteStation) => void;
  onClose: () => void;
}
```

Update the destructuring. Replace:

```tsx
export default function TweaksPanel({ tweaks, onChange, onClose }: TweaksPanelProps) {
```

with:

```tsx
export default function TweaksPanel({ tweaks, onChange, commute, onCommuteChange, onClose }: TweaksPanelProps) {
```

(The `commute` and `onCommuteChange` props are accepted but not rendered yet — Task 4 adds the UI.)

- [ ] **Step 4: Update RhythmView to use configurable stations**

In `app/_components/views/RhythmView.tsx`:

Replace the import line:

```tsx
import { generateDepartures, USER_RHYTHM } from '../../_utils/mock';
```

with:

```tsx
import { generateDepartures } from '../../_utils/mock';
```

Replace the props interface:

```tsx
interface RhythmViewProps {
  tweaks: ITweaks;
  onOpenJourney: (train: IDeparture, fromCode?: string) => void;
  onOpenStation: (station: { code: string; name: string }) => void;
}
```

with:

```tsx
interface RhythmViewProps {
  tweaks: ITweaks;
  homeStation: { code: string; name: string } | null;
  workStation: { code: string; name: string } | null;
  onOpenJourney: (train: IDeparture, fromCode?: string) => void;
  onOpenStation: (station: { code: string; name: string }) => void;
}
```

Replace the function signature and the `rhythm` line:

```tsx
export default function RhythmView({ tweaks, onOpenJourney }: RhythmViewProps) {
  const rhythm = USER_RHYTHM;
```

with:

```tsx
const DEMO_BASELINE = {
  usualDuration: 27,
  historyWeeks: 12,
  onTimeRate: 0.89,
  avgCrowding: 0.62,
};

export default function RhythmView({ tweaks, homeStation, workStation, onOpenJourney }: RhythmViewProps) {
  const home = homeStation ?? { code: 'ASD', name: 'Amsterdam Centraal' };
  const work = workStation ?? { code: 'UT', name: 'Utrecht Centraal' };
```

Update the departures fetch `useEffect`. Replace:

```tsx
        const res = await fetch('/api/departures/ASD', { signal: ctrl.signal });
```

with:

```tsx
        const res = await fetch(`/api/departures/${home.code}`, { signal: ctrl.signal });
```

Replace the mock fallback in the same effect:

```tsx
      if (active && !hasData) setDepartures(generateDepartures('ASD', new Date()));
```

with:

```tsx
      if (active && !hasData) setDepartures(generateDepartures(home.code, new Date()));
```

Change the effect dependency from `[]` to `[home.code]`. Replace:

```tsx
  }, []);
```

(the closing of the departures useEffect, the second one around line 63) with:

```tsx
  }, [home.code]);
```

Update "your train" matching. Replace:

```tsx
    return departures.find(d => d.direction === 'Utrecht Centraal' && d.trainCategory === 'IC')
      ?? departures.find(d => d.direction === 'Utrecht Centraal')
      ?? departures[0];
```

with:

```tsx
    return departures.find(d => (d.direction === work.name || d.destinationCode === work.code) && d.trainCategory === 'IC')
      ?? departures.find(d => d.direction === work.name || d.destinationCode === work.code)
      ?? departures[0];
```

Update the `yourTrain` memo dependency. Replace `}, [departures]);` (the first one, for `yourTrain`) with `}, [departures, work.name, work.code]);`.

Update alternatives filter. Replace:

```tsx
    return departures.filter(d =>
      d.direction === 'Utrecht Centraal' || d.direction === 'Rotterdam Centraal' ||
      d.destinationCode === 'UT' || d.destinationCode === 'RTD'
    ).slice(0, 3);
```

with:

```tsx
    return departures.filter(d =>
      d.direction === work.name || d.destinationCode === work.code
    ).slice(0, 3);
```

Update the `alternatives` memo dependency. Replace `}, [departures]);` (the second one, for `alternatives`) with `}, [departures, work.name, work.code]);`.

Update the "Your commute" eyebrow. Replace:

```tsx
              <div className="eyebrow" style={{ color: 'var(--ink-2)' }}>{rhythm.usualDuration} MIN · {rhythm.historyWeeks} WKS</div>
```

with:

```tsx
              <div className="eyebrow" style={{ color: 'var(--ink-2)' }}>{DEMO_BASELINE.usualDuration} MIN · {DEMO_BASELINE.historyWeeks} WKS</div>
```

Update the hero card click handler. Replace:

```tsx
              <YourTrainCard train={yourTrain} rhythm={rhythm} now={now} onClick={() => onOpenJourney(yourTrain, 'ASD')} tweaks={tweaks} />
```

with:

```tsx
              <YourTrainCard train={yourTrain} home={home} now={now} onClick={() => onOpenJourney(yourTrain, home.code)} tweaks={tweaks} />
```

Update the `YourTrainCardProps` interface and component. Replace:

```tsx
interface YourTrainCardProps {
  train: IDeparture;
  rhythm: typeof USER_RHYTHM;
  now: Date;
  onClick: () => void;
  tweaks: ITweaks;
}

function YourTrainCard({ train, rhythm, now, onClick, tweaks }: YourTrainCardProps) {
```

with:

```tsx
interface YourTrainCardProps {
  train: IDeparture;
  home: { code: string; name: string };
  now: Date;
  onClick: () => void;
  tweaks: ITweaks;
}

function YourTrainCard({ train, home, now, onClick, tweaks }: YourTrainCardProps) {
```

In `YourTrainCard`, replace the rhythm references. Replace:

```tsx
          {rhythm.usualDeparture.trainLabel}
```

with:

```tsx
          {train.trainCategory} {train.trainId ?? ''}
```

Replace:

```tsx
          departs in {minsTo} min · arrives {new Date(actual.getTime() + rhythm.usualDuration * 60000).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
```

with:

```tsx
          departs in {minsTo} min · from {home.name}
```

Update the `BaselineBlock`. Replace:

```tsx
function BaselineBlock({ rhythm }: { rhythm: typeof USER_RHYTHM }) {
  return (
    <div style={{ padding: '16px 20px 4px' }}>
      <h2 className="eyebrow" style={{ marginBottom: 10 }}>Your baseline · last 12 weeks</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <StatCell big={(rhythm.onTimeRate * 100).toFixed(0)} suffix="%" label="on-time" />
        <StatCell big={String(rhythm.usualDuration)} suffix="m" label="avg. ride" />
        <StatCell big={(rhythm.avgCrowding * 100).toFixed(0)} suffix="%" label="avg. crowd" />
      </div>
    </div>
  );
}
```

with:

```tsx
function BaselineBlock() {
  return (
    <div style={{ padding: '16px 20px 4px' }}>
      <h2 className="eyebrow" style={{ marginBottom: 10 }}>Baseline · demo data</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <StatCell big={(DEMO_BASELINE.onTimeRate * 100).toFixed(0)} suffix="%" label="on-time" />
        <StatCell big={String(DEMO_BASELINE.usualDuration)} suffix="m" label="avg. ride" />
        <StatCell big={(DEMO_BASELINE.avgCrowding * 100).toFixed(0)} suffix="%" label="avg. crowd" />
      </div>
    </div>
  );
}
```

Update the `BaselineBlock` call site. Replace:

```tsx
          <BaselineBlock rhythm={rhythm} />
```

with:

```tsx
          <BaselineBlock />
```

Update the LaterToday heading. Replace:

```tsx
        <h2 className="eyebrow">Later today · from ASD</h2>
```

with:

```tsx
        <h2 className="eyebrow">Later today · from {home.code}</h2>
```

But `LaterToday` doesn't have access to `home` — it needs to receive it. Update its call site. Replace:

```tsx
          <LaterToday departures={departures} onOpen={d => onOpenJourney(d, 'ASD')} tweaks={tweaks} />
```

with:

```tsx
          <LaterToday departures={departures} onOpen={d => onOpenJourney(d, home.code)} tweaks={tweaks} homeCode={home.code} />
```

Update the `LaterToday` function signature. Replace:

```tsx
function LaterToday({ departures, onOpen, tweaks }: { departures: IDeparture[] | null; onOpen: (d: IDeparture) => void; tweaks: ITweaks }) {
```

with:

```tsx
function LaterToday({ departures, onOpen, tweaks, homeCode }: { departures: IDeparture[] | null; onOpen: (d: IDeparture) => void; tweaks: ITweaks; homeCode: string }) {
```

And in `LaterToday`, replace the heading:

```tsx
        <h2 className="eyebrow">Later today · from ASD</h2>
```

with:

```tsx
        <h2 className="eyebrow">Later today · from {homeCode}</h2>
```

- [ ] **Step 5: Delete USER_RHYTHM from mock.ts**

In `app/_utils/mock.ts`, delete lines 138–153 (the entire `USER_RHYTHM` export):

```tsx
export const USER_RHYTHM = {
  homeCode: 'ASD',
  homeName: 'Amsterdam Centraal',
  workCode: 'UT',
  workName: 'Utrecht Centraal',
  usualDeparture: { h: 8, m: 14, trainLabel: 'IC 3523', track: '5', category: 'IC' },
  usualDuration: 27,
  historyWeeks: 12,
  onTimeRate: 0.89,
  avgCrowding: 0.62,
  commonSwaps: [
    { label: 'IC 3521', delta: -7, fasterBy: 0, crowdingDelta: +0.18 },
    { label: 'IC 3525', delta: +7, fasterBy: 0, crowdingDelta: -0.24 },
    { label: 'ICD 923', delta: -4, fasterBy: 3, crowdingDelta: +0.11 },
  ],
};
```

- [ ] **Step 6: Run the gate**

Run: `npm run lint && npm test && npm run build`
Expected: lint 0 errors (2 pre-existing warnings OK), all 23 tests pass, build clean.

- [ ] **Step 7: Commit**

```bash
git add app/interfaces/interfaces.tsx app/page.tsx app/_components/TweaksPanel.tsx app/_components/views/RhythmView.tsx app/_utils/mock.ts
git commit -m "$(cat <<'EOF'
feat: make RhythmView use configurable home/work stations

Replaces the hardcoded ASD→UT commute with localStorage-persisted
home/work station settings. Departures fetch, train matching, and
fromCode all use the configured stations. Defaults to ASD→UT for
first-time users.

PRO-<N>
EOF
)"
```

---

### Task 3: StationPicker component

**Files:**
- Create: `app/_components/shared/StationPicker.tsx`

- [ ] **Step 1: Create the StationPicker component**

Create `app/_components/shared/StationPicker.tsx`:

```tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { STATIONS } from '../../_utils/mock';
import { IconSearch, IconClose } from '../icons/Icons';

interface StationPickerProps {
  label: string;
  value: { code: string; name: string } | null;
  onChange: (station: { code: string; name: string }) => void;
}

export default function StationPicker({ label, value, onChange }: StationPickerProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<{ code: string; name: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    // Focus input when expanded
    queueMicrotask(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;

    // Local search
    const lo = q.toLowerCase();
    const local = q.length < 1
      ? STATIONS.slice(0, 5)
      : STATIONS.filter(s => s.name.toLowerCase().includes(lo) || s.code.toLowerCase().includes(lo)).slice(0, 5);
    setResults(local);

    // Live API search for queries >= 2 chars
    if (q.length < 2) return;
    let cancelled = false;
    fetch(`/api/stations?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setResults(data.slice(0, 5));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [q, open]);

  const pick = (station: { code: string; name: string }) => {
    onChange(station);
    setOpen(false);
    setQ('');
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={`${label}: ${value?.name ?? 'not set'}. Click to change.`}
        style={{
          width: '100%', padding: '10px 14px',
          background: 'var(--bg-2)', borderRadius: 10,
          border: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          textAlign: 'left',
        }}
      >
        <span className="serif" style={{ fontSize: 15 }}>
          {value?.name ?? 'Select station'}
        </span>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
          {value?.code ?? ''}
        </span>
      </button>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 10,
        border: '1px solid var(--accent)',
      }}>
        <IconSearch aria-hidden="true" style={{ width: 14, height: 14, color: 'var(--ink-3)', flexShrink: 0 }} />
        <label htmlFor={`picker-${label}`} className="sr-only">{label}</label>
        <input
          ref={inputRef}
          id={`picker-${label}`}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search stations…"
          style={{
            flex: 1, background: 'transparent', border: 0,
            fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit',
          }}
        />
        <button
          onClick={() => { setOpen(false); setQ(''); }}
          aria-label="Cancel"
          style={{ color: 'var(--ink-3)', padding: 2 }}
        >
          <IconClose aria-hidden="true" style={{ width: 14, height: 14 }} />
        </button>
      </div>
      <div style={{ marginTop: 4 }}>
        {results.map(s => (
          <button
            key={s.code}
            onClick={() => pick(s)}
            style={{
              width: '100%', padding: '8px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              textAlign: 'left', borderBottom: '1px solid var(--line-2)',
              fontSize: 14,
            }}
          >
            <span>{s.name}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{s.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run the gate**

Run: `npm run lint && npm test && npm run build`
Expected: all pass. (StationPicker is not imported anywhere yet, but must compile cleanly.)

- [ ] **Step 3: Commit**

```bash
git add app/_components/shared/StationPicker.tsx
git commit -m "$(cat <<'EOF'
feat: add StationPicker component

Compact station selector with inline search for use in TweaksPanel.
Searches local STATIONS array instantly, then falls back to the live
/api/stations endpoint for queries >= 2 chars.

PRO-<N>
EOF
)"
```

---

### Task 4: Commute section in TweaksPanel

**Files:**
- Modify: `app/_components/TweaksPanel.tsx`

- [ ] **Step 1: Add the commute section to TweaksPanel**

In `app/_components/TweaksPanel.tsx`, add the StationPicker import after the existing imports:

```tsx
import StationPicker from './shared/StationPicker';
```

In the TweaksPanel body, add the commute section **before** the first `<TweakRow>` (the Theme row). After the close button `</div>` (line 81) and before `<TweakRow label="Theme">` (line 84), add:

```tsx
      <TweakRow label="Your commute">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>FROM</div>
            <StationPicker label="From" value={commute.home} onChange={s => onCommuteChange('home', s)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => {
                if (commute.home && commute.work) {
                  const prev = { home: commute.home, work: commute.work };
                  onCommuteChange('home', prev.work);
                  onCommuteChange('work', prev.home);
                }
              }}
              aria-label="Swap home and work stations"
              style={{
                padding: '4px 12px', fontSize: 11, color: 'var(--ink-2)',
                background: 'var(--bg-2)', borderRadius: 100,
                border: '1px solid var(--line)',
              }}
            >
              ↕ swap
            </button>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>TO</div>
            <StationPicker label="To" value={commute.work} onChange={s => onCommuteChange('work', s)} />
          </div>
        </div>
      </TweakRow>

      <div className="hairline" style={{ margin: '2px 0 14px' }} />
```

- [ ] **Step 2: Run the gate**

Run: `npm run lint && npm test && npm run build`
Expected: all pass.

- [ ] **Step 3: Manual smoke test**

Run `npm run dev`:
- Open Tweaks panel → "Your commute" section visible at top with From/To fields showing ASD/UT
- Click "From" → inline search opens, type "rot" → Rotterdam appears, click it → field updates
- Click "To" → search, pick "Den Haag Centraal"
- Swap button flips them
- Close Tweaks → RhythmView shows departures from the new home station, matches trains toward new work station
- Reload page → commute persists

- [ ] **Step 4: Commit**

```bash
git add app/_components/TweaksPanel.tsx
git commit -m "$(cat <<'EOF'
feat: add commute picker to TweaksPanel

Users can now set their home and work stations via inline station
search in the Tweaks panel. A swap button flips the two. Selections
persist to localStorage and immediately update RhythmView.

PRO-<N>
EOF
)"
```

---

### Task 5: PR + Linear sync

- [ ] **Step 1: Push and open the PR**

```bash
git push -u origin julianaijal/pro-<N>-configurable-commute
gh pr create --title "feat: configurable commute (home/work station picker)" --body "$(cat <<'EOF'
## Summary
- Users can set their home and work stations in the Tweaks panel via inline station search
- RhythmView fetches departures for the configured home station and matches trains toward the configured work station
- Commute persists across sessions via localStorage (defaults to ASD → UT)
- New `StationPicker` component with dual-source search (local + live API)
- Removed hardcoded `USER_RHYTHM` mock data from RhythmView
- Baseline stats honestly labelled as "demo data"

Fixes PRO-<N>

## Test plan
- [ ] CI passes (lint, tests, build)
- [ ] Fresh load (no localStorage): Rhythm shows ASD → UT defaults
- [ ] Change home to Rotterdam via Tweaks: departures refetch from RTD
- [ ] Change work to Den Haag: hero card matches trains toward GVC
- [ ] Swap button flips home/work
- [ ] Reload: commute persists from localStorage
- [ ] Station picker search: local + live API results

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed. Report it to the user.

- [ ] **Step 2: Watch CI**

Run: `gh pr checks --watch`
Expected: the `ci` job passes.

- [ ] **Step 3: Verify Linear state**

If the Linear API key works:

```bash
source .env
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" -H "Content-Type: application/json" \
  -d '{"query":"query { issue(id: \"PRO-<N>\") { state { name } } }"}'
```

Expected: state "In Review" (the `Fixes PRO-<N>` link should move it via webhook). If still "In Progress", update it:

```bash
PRO_ID=$(curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" -H "Content-Type: application/json" \
  -d '{"query":"query { issue(id: \"PRO-<N>\") { id } }"}' | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["issue"]["id"])')
curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation { issueUpdate(id: \\\"$PRO_ID\\\", input: { stateId: \\\"8a623c27-bd43-4a20-8b9e-8c0d7167f736\\\" }) { success } }\"}"
```
