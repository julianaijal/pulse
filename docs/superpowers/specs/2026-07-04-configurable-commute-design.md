# Configurable Commute — Design Spec

## Problem

RhythmView — the default landing screen and core value proposition — is entirely hardcoded to Amsterdam Centraal → Utrecht Centraal. The hero card, departure list, and train matching all assume a single route. Users cannot personalise their commute.

## Goal

Let users set their home and work stations. RhythmView fetches departures for the configured home station and matches trains toward the configured work station. The commute persists across sessions via localStorage.

## Non-goals

- History tracking / computed baselines (future project; requires data accumulation over weeks)
- New API routes
- Component-level unit tests (no React Testing Library in the project)
- Changes to PulseView, JourneyView, or StationView
- Onboarding flow or first-run wizard

---

## Data Model

### CommuteStation type (interfaces.tsx)

```ts
export interface CommuteStation {
  code: string;
  name: string;
}
```

Added to `app/interfaces/interfaces.tsx` alongside the existing interfaces.

### Commute state (page.tsx)

```ts
interface CommuteStation {
  code: string;
  name: string;
}

// State in Home component
const [commute, setCommute] = useState<{
  home: CommuteStation | null;
  work: CommuteStation | null;
}>({ home: null, work: null });
```

### localStorage keys

| Key | Value | Default |
|-----|-------|---------|
| `pulse.homeStation` | JSON `{ code, name }` | `{ "code": "ASD", "name": "Amsterdam Centraal" }` |
| `pulse.workStation` | JSON `{ code, name }` | `{ "code": "UT", "name": "Utrecht Centraal" }` |

Defaults are applied when localStorage has no value — first-time users see a working Rhythm view immediately.

### Hydration

The existing `useEffect` in `Home` that loads tweaks also reads the commute keys with `JSON.parse` inside try/catch, falling back to defaults on parse failure or missing keys.

---

## New Component: StationPicker

**File:** `app/_components/shared/StationPicker.tsx`

A compact station selector for use inside TweaksPanel.

### Props

```ts
interface StationPickerProps {
  label: string;                              // "From" or "To"
  value: { code: string; name: string } | null;
  onChange: (station: { code: string; name: string }) => void;
}
```

### States

- **Collapsed** (default): Renders a button showing the station name and code (e.g. "Amsterdam Centraal · ASD"). Clicking expands.
- **Expanded**: Shows a text input with station search. Uses the same dual-source pattern as `StationSearch`: instant local filter from `STATIONS` array in `mock.ts`, then async `/api/stations?q=` for live results when query >= 2 chars. Displays max 5 results. Picking a station collapses the picker and fires `onChange`.

### Search logic (reused pattern from StationSearch)

1. On query change, filter `STATIONS` locally by name/code match (case-insensitive)
2. If query >= 2 chars, also fetch `/api/stations?q=...` and replace results on success
3. Show up to 5 results as buttons with station name + code

---

## TweaksPanel Changes

**File:** `app/_components/TweaksPanel.tsx`

### New props

```ts
interface TweaksPanelProps {
  tweaks: ITweaks;
  onChange: (key: keyof ITweaks, value: string) => void;
  commute: { home: CommuteStation | null; work: CommuteStation | null };
  onCommuteChange: (key: 'home' | 'work', station: CommuteStation) => void;
  onClose: () => void;
}
```

### New section: "Your commute"

Added at the top of the panel (before Theme). Contains:

1. **From** — `StationPicker` bound to `commute.home`
2. **Swap button** — flips home and work values by calling `onCommuteChange` twice
3. **To** — `StationPicker` bound to `commute.work`

---

## page.tsx Changes

**File:** `app/page.tsx`

### New state

```ts
const [commute, setCommute] = useState<{
  home: CommuteStation | null;
  work: CommuteStation | null;
}>({ home: null, work: null });
```

### Hydration (in existing useEffect)

```ts
const parseStation = (key: string) => {
  try { return JSON.parse(localStorage.getItem(key) ?? ''); }
  catch { return null; }
};
setCommute({
  home: parseStation('pulse.homeStation') ?? { code: 'ASD', name: 'Amsterdam Centraal' },
  work: parseStation('pulse.workStation') ?? { code: 'UT', name: 'Utrecht Centraal' },
});
```

### Persistence helper

```ts
const setCommuteStation = (key: 'home' | 'work', station: CommuteStation) => {
  setCommute(c => ({ ...c, [key]: station }));
  localStorage.setItem(key === 'home' ? 'pulse.homeStation' : 'pulse.workStation', JSON.stringify(station));
};
```

### Wiring

- `RhythmView` receives `homeStation={commute.home}` and `workStation={commute.work}`
- `TweaksPanel` receives `commute={commute}` and `onCommuteChange={setCommuteStation}`

---

## RhythmView Changes

**File:** `app/_components/views/RhythmView.tsx`

### New props

```ts
interface RhythmViewProps {
  tweaks: ITweaks;
  homeStation: { code: string; name: string };
  workStation: { code: string; name: string };
  onOpenJourney: (train: IDeparture, fromCode?: string) => void;
  onOpenStation: (station: { code: string; name: string }) => void;
}
```

### Departures fetch

- `/api/departures/ASD` → `/api/departures/${homeStation.code}`
- The `useEffect` dependency changes from `[]` to `[homeStation.code]` so it refetches when the user changes their home station

### "Your train" matching

- Currently: `d.direction === 'Utrecht Centraal'`
- Changes to: `d.direction === workStation.name || d.destinationCode === workStation.code`

### fromCode

- `onOpenJourney(yourTrain, 'ASD')` → `onOpenJourney(yourTrain, homeStation.code)`
- Same for `LaterToday` onOpen callback

### "Later today" heading

- `"Later today · from ASD"` → `"Later today · from {homeStation.code}"`

### Baseline block

- Stays with hardcoded demo values (89% on-time, 27 min, 62% crowding)
- Heading changes from "Your baseline · last 12 weeks" to "Baseline · demo data"
- Makes it honest that these aren't computed from real history

### USER_RHYTHM cleanup

- `USER_RHYTHM` export in `mock.ts` is no longer imported by RhythmView
- The `usualDeparture`, `usualDuration`, `historyWeeks`, `onTimeRate`, `avgCrowding` values move inline into RhythmView as constants (they're display-only defaults until history tracking exists)
- `USER_RHYTHM` is deleted from `mock.ts` if no other file imports it

---

## What stays the same

- No changes to `ITweaks` interface
- No changes to any API routes
- No changes to PulseView, JourneyView, StationView, StationSearch
- No changes to the head inline theme script
- The greeting ("Good morning.", "You have a train to catch.") is route-agnostic — unchanged
- `AnomalyBlock` stays as-is (it already works with whatever departures are loaded)

---

## Testing

### Automated gate (every commit)

`npm run lint && npm test && npm run build` — all 23 existing tests pass, build succeeds.

### Manual verification

1. **Fresh load** (clear localStorage): Rhythm shows ASD → UT defaults, hero card works
2. **Change home** via Tweaks to Rotterdam: Rhythm refetches from `/api/departures/RTD`, "Later today" heading shows "from RTD"
3. **Change work** via Tweaks to Den Haag: hero card matches trains toward Den Haag Centraal
4. **Swap button**: flips home/work stations, Rhythm updates accordingly
5. **Reload**: commute persists from localStorage
6. **Station picker search**: type "utr" → results from local filter + live API
