# Pulse Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the editorial serif aesthetic with a transit-app look (Plus Jakarta Sans, transit-blue hex palette, white card UI) while preserving all existing behavior and state management.

**Architecture:** Pure presentation-layer overhaul. Token replacement in globals.css forms the foundation, then each view/component is restyled in isolation. The `ITweaks` interface loses `theme` and `accent` fields; `crowdingStyle` simplifies to a single style.

**Tech Stack:** Next.js 16 / React 19, CSS custom properties, inline styles, Plus Jakarta Sans (Google Fonts)

## Global Constraints

- Font: Plus Jakarta Sans, weights 400–800, `font-variant-numeric: tabular-nums` on all numbers
- Colors: hex values only (no OKLCH) — see token table in spec
- No dark mode, no accent switching
- No new state, hooks, or data flows
- No new dependencies beyond the font
- Preserve all existing accessibility (aria-labels, live regions, focus management, keyboard nav)
- Design reference screenshots at `/Users/aijal000/Downloads/design_handoff_pulse_redesign/screenshots/`
- Design spec at `docs/superpowers/specs/2026-07-05-pulse-redesign-design.md`
- Each task = one atomic commit

---

### Task 1: Replace design tokens and font in globals.css + layout.tsx

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: All CSS custom properties that every other file consumes (`--bg`, `--card`, `--line`, `--ink`, `--primary`, `--ok`, `--warn`, `--bad`, etc.)

- [ ] **Step 1: Replace the `:root` token block in globals.css**

Replace lines 1–28 of `app/globals.css` (from the comment through the closing `}` of `:root`) with:

```css
/* Pulse — transit companion */

:root {
  --bg:            #F2F4F8;
  --card:          #FFFFFF;
  --line:          #E3E8F0;
  --line-row:      #EEF1F6;
  --subtle:        #F7F9FC;

  --ink:           #0B1526;
  --ink-2:         #3D4C63;
  --ink-3:         #5A6B82;
  --ink-4:         #8FA3BE;
  --ink-cancel:    #B7C2D2;

  --primary:       #0A5CE8;
  --primary-tint:  #EAF1FE;
  --primary-deep:  #0A2C66;
  --primary-muted: #9DB6E3;

  --ok:            #0E9F5B;
  --ok-light:      #2FCB82;
  --ok-tint:       #D9F3E6;
  --ok-ring:       #7FE0AE;

  --warn:          #FFB300;
  --warn-accent:   #E88A00;
  --warn-text:     #B26A00;
  --warn-dark:     #3A2A00;
  --warn-tint:     #FFF6E5;
  --warn-border:   #F5DBA6;

  --bad:           #DF3B4B;
  --bad-tint:      #FDECEE;
  --bad-border:    #F3D4D8;

  --map-land:      #EEF3FA;
  --map-stroke:    #D4DEEC;
  --map-route:     #C3D2E8;

  --radius: 16px;
  --radius-lg: 22px;
  --sidebar-w: 240px;
}
```

- [ ] **Step 2: Delete the dark mode block**

Delete lines 31–48 (the entire `[data-theme="dark"] { ... }` block).

- [ ] **Step 3: Update body font-family**

In the `html, body` rule, change `font-family` from:
```css
font-family: 'Inter', -apple-system, system-ui, sans-serif;
```
to:
```css
font-family: 'Plus Jakarta Sans', -apple-system, system-ui, sans-serif;
```

- [ ] **Step 4: Update the tablet frame background**

In the `@media (min-width: 441px) and (max-width: 767px)` block, change:
```css
body { background: var(--bg-3); }
```
to:
```css
body { background: #E3E8F0; }
```

- [ ] **Step 5: Update desktop background**

In the `@media (min-width: 768px)` block, change:
```css
body { background: var(--bg-3); }
```
to:
```css
body { background: #E3E8F0; }
```

- [ ] **Step 6: Update the mobile tweaks FAB**

Change `background: var(--bg-2)` to `background: var(--card)` in the `.pulse-tweaks-fab` rule.

- [ ] **Step 7: Update desktop sidebar styles**

In the desktop `.pulse-sidebar` rule, change:
- `background: var(--bg)` → `background: var(--card)`

In `.pulse-sidebar-item[data-active="true"]`, change:
```css
color: var(--accent);
background: var(--accent-dim);
```
to:
```css
color: #FFFFFF;
background: var(--primary);
border-radius: 999px;
```

In `.pulse-sidebar-item:hover:not([data-active="true"])`, change:
```css
color: var(--ink);
background: var(--bg-2);
```
to:
```css
color: var(--ink);
background: var(--subtle);
```

Update `.pulse-sidebar-item` base styles: change `color: var(--ink-3)` to `color: var(--ink-2)`, `font-weight: 500` to `font-weight: 600`, and `border-radius: 10px` to `border-radius: 999px`.

- [ ] **Step 8: Update typography classes**

Replace the three font classes (`.serif`, `.mono`, `.sans`) and the `.eyebrow` class with:
```css
.eyebrow {
  font-size: 0.65625rem; /* 10.5/16 */
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
  font-weight: 700;
}

.num {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}
```
(Delete `.serif`, `.mono`, `.sans` entirely. Keep `.num` as-is.)

- [ ] **Step 9: Update dot and animation styles**

Replace the `.dot.live` and `@keyframes pulseDot` rules with:
```css
.dot.live { background: var(--ok); animation: pulseDot 2s ease-in-out infinite; }

@keyframes pulseDot {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}
```

- [ ] **Step 10: Update the `.card` class**

Change:
```css
.card {
  background: var(--bg-2);
  border-radius: var(--radius);
  border: 1px solid var(--line);
}
```
to:
```css
.card {
  background: var(--card);
  border-radius: var(--radius);
  border: 1px solid var(--line);
}
```

- [ ] **Step 11: Update the `.now-pill` class**

Replace the `.now-pill` rule with:
```css
.now-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  font-size: 0.8125rem; /* 13/16 */
  font-weight: 600;
  color: var(--ink);
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 999px;
}
```

- [ ] **Step 12: Update `.chip` styles**

Replace the `.chip` and its modifier rules with:
```css
.chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 8px; border-radius: 999px;
  font-size: 0.65625rem; /* 10.5/16 */ font-weight: 700;
  letter-spacing: 0.04em;
  background: var(--primary-tint); color: var(--primary);
  border: 1px solid transparent;
}
.chip.ok   { background: var(--ok-tint); color: var(--ok); }
.chip.warn { background: var(--warn-tint); color: var(--warn-text); }
.chip.bad  { background: var(--bad-tint); color: var(--bad); }
```

- [ ] **Step 13: Update `.section-title` h2**

Change the `.section-title h2` font from:
```css
font-family: 'Instrument Serif', serif;
font-weight: 400; font-size: 1.625rem; line-height: 1.5; letter-spacing: -0.015em;
```
to:
```css
font-weight: 800; font-size: 1.4375rem; /* 23/16 */ line-height: 1.2; letter-spacing: -0.02em;
```

- [ ] **Step 14: Update skeleton and focus-visible styles**

Change `.skeleton` background from `var(--bg-3)` to `var(--line-row)`.

Change `:focus-visible` outline from `var(--accent)` to `var(--primary)`.

- [ ] **Step 15: Update desktop `.rhythm-grid`**

Change the grid definition from `grid-template-columns: 1fr 1fr` to `grid-template-columns: 1fr 360px` and add `gap: 20px`. Remove `column-gap: 0`.

Change `.rhythm-col-l` border from `border-right: 1px solid var(--line-2)` to `border-right: none` (the card-based layout replaces the column divider).

- [ ] **Step 16: Update desktop Pulse layout borders**

In `.pulse-map-area`, change `border-right: 1px solid var(--line-2)` to `border-right: none`.

- [ ] **Step 17: Update the tabbar styles**

Replace the `.tabbar` block and its children with:
```css
.tabbar {
  position: sticky;
  bottom: 0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--line);
  border-radius: 0;
  padding: 0;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  z-index: 50;
  margin: 0;
  box-shadow: none;
}

.tabbar-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.tabbar button {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 10px 4px 0;
  color: var(--ink-4);
  font-size: 0.59375rem; /* 9.5/16 */ letter-spacing: 0; text-transform: none; font-weight: 600;
  transition: color 0.15s;
}
.tabbar button[data-active="true"] {
  color: var(--primary);
  background: none;
  font-weight: 800;
}
.tabbar button svg { width: 21px; height: 21px; }
```

- [ ] **Step 18: Update tweaks panel background**

In `.tweaks`, change `background: var(--bg)` to `background: var(--card)`.

- [ ] **Step 19: Update layout.tsx — font link and theme script**

In `app/layout.tsx`:

Change `themeColor` from `'#f5f1e8'` to `'#F2F4F8'`.

Replace the Google Fonts `<link>` href from:
```
https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap
```
to:
```
https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap
```

Delete the entire `<script dangerouslySetInnerHTML>` block (the theme/accent initialization script).

Change the metadata description from `'Your editorial transit companion for the Dutch rail network.'` to `'Your Dutch rail companion.'`.

- [ ] **Step 20: Verify and commit**

Run: `cd /Users/aijal000/code/transit && npm run build`
Expected: Build succeeds (there will be runtime warnings from components still referencing removed classes like `.serif`, `.mono` — that's expected, they get fixed in later tasks).

```bash
git add app/globals.css app/layout.tsx
git commit -m "style: replace design tokens with transit-blue hex palette and Plus Jakarta Sans

Swap OKLCH editorial tokens for hex transit-blue palette. Replace
Instrument Serif / JetBrains Mono / Inter with Plus Jakarta Sans.
Remove dark mode and accent-switching CSS. Update all global
utility classes (card, chip, dot, tabbar, now-pill, eyebrow)."
```

---

### Task 2: Simplify ITweaks interface and TweaksPanel

**Files:**
- Modify: `app/interfaces/interfaces.tsx`
- Modify: `app/_components/TweaksPanel.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: Simplified `ITweaks` type (no `theme`, no `accent`, `crowdingStyle` is just `'bars'`)
- Consumes: CSS custom properties from Task 1

- [ ] **Step 1: Simplify ITweaks interface**

In `app/interfaces/interfaces.tsx`, replace the `ITweaks` interface:

```typescript
export interface ITweaks {
  verbosity: 'minimal' | 'rich';
}
```

Remove the `theme`, `crowdingStyle`, and `accent` fields.

- [ ] **Step 2: Update TweaksPanel**

In `app/_components/TweaksPanel.tsx`:

Delete the `ACCENT_MAP` constant and its export.

Remove the `AccentSwatches` function entirely.

Remove the Theme `TweakRow`, the Crowding display `TweakRow`, and the Accent `TweakRow` from the panel JSX. Keep only the "Your commute" section and the "Verbosity" section.

Update the `TweaksPanelProps` interface — remove `commute` prop type from needing accent values.

Delete the `Segmented` component's usage of theme option `[['light', 'Light'], ['dark', 'Dark']]` — just keep the Verbosity segmented.

The file should export `TweaksPanel` as default (no more `ACCENT_MAP` export).

- [ ] **Step 3: Update page.tsx**

In `app/page.tsx`:

Remove the `import { ACCENT_MAP } from './_components/TweaksPanel'` line.

Update `TWEAK_DEFAULTS` to:
```typescript
const TWEAK_DEFAULTS: ITweaks = {
  verbosity: 'rich',
};
```

Update `loadTweaks()` to only load `verbosity`:
```typescript
function loadTweaks(): ITweaks {
  if (typeof window === 'undefined') return TWEAK_DEFAULTS;
  return {
    verbosity: (localStorage.getItem('pulse.verbosity') as ITweaks['verbosity']) ?? TWEAK_DEFAULTS.verbosity,
  };
}
```

Remove the `useEffect` that sets `document.documentElement.dataset.theme` and `--accent` (the one depending on `[tweaks.theme, tweaks.accent]`).

In the `updateTweak` function, only persist `verbosity`.

Update `NAV_ITEMS` labels from `['Rhythm', 'Pulse', 'Journey', 'Search']` to `['Home', 'Network', 'Journeys', 'Stations']`.

- [ ] **Step 4: Update sidebar logo in page.tsx**

Replace the current logo block in the sidebar:
```tsx
<div className="pulse-sidebar-logo">
  <span className="serif" style={{ fontSize: 22, lineHeight: 1, letterSpacing: '-0.02em' }}>
    Pulse<em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>.</em>
  </span>
</div>
```
with:
```tsx
<div className="pulse-sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
  <div style={{
    width: 34, height: 34, borderRadius: 10,
    background: 'var(--primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <svg width="20" height="20" viewBox="0 0 16 20" fill="none">
      <path d="M2 10h3l2-5 3 10 2.5-7 1.5 2h4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
  <div>
    <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.1, color: 'var(--ink)' }}>Pulse</div>
    <div style={{ fontSize: 10.5, color: 'var(--ink-3)', lineHeight: 1.2 }}>Dutch rail companion</div>
  </div>
</div>
```

- [ ] **Step 5: Add commute card to sidebar bottom**

In `page.tsx`, between the spacer `<div style={{ flex: 1 }} />` and the Tweaks button in the sidebar, add a commute card:

```tsx
{/* Commute card */}
<div style={{
  background: 'var(--subtle)', borderRadius: 12, padding: '12px 14px', marginBottom: 12,
}}>
  <div className="eyebrow" style={{ marginBottom: 6, fontSize: 10 }}>MY COMMUTE</div>
  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
    <span>{commute.home?.name ? commute.home.name.replace(' Centraal', ' C').replace('Amsterdam', 'Amsterdam') : 'Home'}</span>
    <span style={{ color: 'var(--primary)' }}>→</span>
    <span>{commute.work?.name ? commute.work.name.replace(' Centraal', ' C') : 'Work'}</span>
  </div>
  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
    {DEMO_BASELINE.usualDuration} min avg · {(DEMO_BASELINE.onTimeRate * 100).toFixed(0)}% on time
  </div>
</div>
```

Add `const DEMO_BASELINE = { usualDuration: 27, onTimeRate: 0.89 };` near the top of the file (before the component).

- [ ] **Step 6: Fix all type errors from ITweaks changes**

Update all components that receive `tweaks` prop to not reference `tweaks.crowdingStyle`, `tweaks.theme`, or `tweaks.accent`. The affected files pass these down but the actual fixing happens in later tasks. For now, ensure `page.tsx` compiles.

Specifically in `page.tsx`, remove the line:
```tsx
document.documentElement.style.setProperty('--accent', ACCENT_MAP[tweaks.accent] ?? ACCENT_MAP.orange);
```

- [ ] **Step 7: Verify and commit**

Run: `cd /Users/aijal000/code/transit && npx tsc --noEmit`
Expected: No type errors (or only errors in view files that still reference removed `ITweaks` fields — those are fixed in later tasks).

```bash
git add app/interfaces/interfaces.tsx app/_components/TweaksPanel.tsx app/page.tsx
git commit -m "refactor: simplify ITweaks, remove dark mode/accent, redesign sidebar

Strip theme and accent from ITweaks. Remove ACCENT_MAP and accent
swatches from TweaksPanel. Update sidebar with new logo, nav labels,
and commute card. Remove theme initialization effect."
```

---

### Task 3: Update Icons and add new icon components

**Files:**
- Modify: `app/_components/icons/Icons.tsx`

**Interfaces:**
- Produces: `IconSwap` (new), updated `baseProps.strokeWidth` to 1.7
- Consumes: nothing new

- [ ] **Step 1: Update baseProps and add IconSwap**

In `app/_components/icons/Icons.tsx`:

Change `strokeWidth: 1.6` to `strokeWidth: 1.7` in `baseProps`.

Add the new `IconSwap` component at the end of the file:

```typescript
export function IconSwap(p: IconProps) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M7 10l-3 3 3 3" />
      <path d="M4 13h12" />
      <path d="M17 14l3-3-3-3" />
      <path d="M20 11H8" />
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/icons/Icons.tsx
git commit -m "style: update icon stroke width to 1.7 and add IconSwap"
```

---

### Task 4: Restyle shared components (NowPill, CrowdingStrip, DepartureRow, FullDepartureRow)

**Files:**
- Modify: `app/_components/shared/NowPill.tsx`
- Modify: `app/_components/shared/CrowdingStrip.tsx`
- Modify: `app/_components/shared/DepartureRow.tsx`
- Modify: `app/_components/shared/FullDepartureRow.tsx`

**Interfaces:**
- Produces: Updated component visuals matching the design, simplified `CrowdingStrip` (no more `style` prop)
- Consumes: CSS tokens from Task 1, `ITweaks` from Task 2

- [ ] **Step 1: Restyle NowPill**

Replace the entire content of `app/_components/shared/NowPill.tsx` with:

```tsx
'use client';

import React, { useState, useEffect } from 'react';

interface NowPillProps {
  label?: string;
}

export default function NowPill({ label }: NowPillProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    const rafId = requestAnimationFrame(() => setTime(fmt()));
    const id = setInterval(() => setTime(fmt()), 15000);
    return () => { cancelAnimationFrame(rafId); clearInterval(id); };
  }, []);

  return (
    <span className="now-pill">
      <span className="dot live" /> {label ?? time}
    </span>
  );
}
```

(The visual change comes from the updated `.now-pill` CSS in Task 1 — the component itself stays the same.)

- [ ] **Step 2: Simplify CrowdingStrip**

Replace `app/_components/shared/CrowdingStrip.tsx` with:

```tsx
'use client';

import React from 'react';

interface CrowdingStripProps {
  crowding: number[];
  variant?: 'hero' | 'card' | 'journey';
  size?: 'sm' | 'md';
  recommendedCar?: number;
}

export default function CrowdingStrip({ crowding, variant = 'card', size = 'md', recommendedCar }: CrowdingStripProps) {
  const h = size === 'sm' ? 14 : variant === 'hero' ? 22 : 19;
  const srSummary = crowding.map((c, i) =>
    `car ${i + 1} ${c < 0.4 ? 'quiet' : c < 0.75 ? 'moderate' : 'busy'}`
  ).join(', ');

  return (
    <div>
      <span className="sr-only">Carriage occupancy: {srSummary}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {crowding.map((c, i) => {
          const isRec = recommendedCar === i;
          let bg: string;
          let border: string | undefined;

          if (variant === 'hero') {
            if (isRec) { bg = '#2FCB82'; border = '2px solid #7FE0AE'; }
            else if (c >= 0.75) { bg = '#FFB300'; }
            else { bg = `rgba(255,255,255,${0.28 + c * 0.17})`; }
          } else {
            if (isRec) { bg = '#2FCB82'; border = '2px solid #0E9F5B'; }
            else if (c >= 0.75) { bg = '#E88A00'; }
            else if (c >= 0.4) { bg = '#8FA3BE'; }
            else { bg = '#CBD7E8'; }
          }

          return (
            <div key={i} style={{
              flex: 1, height: h, borderRadius: 6,
              background: bg,
              border: border ?? 'none',
            }} />
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Restyle DepartureRow**

Replace `app/_components/shared/DepartureRow.tsx` with:

```tsx
'use client';

import React from 'react';
import { IDeparture } from '../../interfaces/interfaces';

interface DepartureRowProps {
  d: IDeparture;
  onClick: () => void;
}

export default function DepartureRow({ d, onClick }: DepartureRowProps) {
  const actual = new Date(d.actualDateTime);
  const timeStr = actual.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

  return (
    <button
      onClick={onClick}
      aria-label={`${d.direction}, vertrekt ${timeStr}${d.delayMinutes > 0 ? `, ${d.delayMinutes} min vertraging` : ', op tijd'}${d.cancelled ? ', geannuleerd' : ''}. Klik voor reisdetails.`}
      style={{
        width: '100%', padding: '11px 0', display: 'flex', gap: 10, alignItems: 'center',
        borderBottom: '1px solid var(--line-row)', textAlign: 'left',
        background: 'transparent', transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--subtle)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Time */}
      <div className="num" style={{
        width: 48, fontSize: 15, fontWeight: 800,
        textDecoration: d.cancelled ? 'line-through' : 'none',
        color: d.cancelled ? 'var(--ink-cancel)' : 'var(--ink)',
      }}>
        {timeStr}
      </div>

      {/* Category badge */}
      <span style={{
        padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 700,
        background: d.cancelled ? 'var(--bad-tint)' : 'var(--primary-tint)',
        color: d.cancelled ? 'var(--bad)' : 'var(--primary)',
      }}>
        {d.trainCategory}
      </span>

      {/* Destination */}
      <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {d.direction}
      </span>

      {/* Status */}
      <span style={{
        fontSize: 12, fontWeight: d.cancelled || d.delayMinutes > 0 ? 800 : 700, whiteSpace: 'nowrap',
        color: d.cancelled ? 'var(--bad)' : d.delayMinutes > 0 ? 'var(--warn-accent)' : 'var(--ok)',
      }}>
        {d.cancelled ? 'cancelled' : d.delayMinutes > 0 ? `+${d.delayMinutes}` : 'on time'}
      </span>

      {/* Track badge */}
      <span style={{
        minWidth: 28, textAlign: 'center', padding: '2px 6px',
        border: '1.5px solid var(--line)', borderRadius: 7,
        fontSize: 12, fontWeight: 700, color: 'var(--ink)',
      }}>
        {d.cancelled ? '—' : d.actualTrack}
      </span>
    </button>
  );
}
```

- [ ] **Step 4: Restyle FullDepartureRow**

Replace `app/_components/shared/FullDepartureRow.tsx` with:

```tsx
'use client';

import React from 'react';
import { IDeparture } from '../../interfaces/interfaces';

interface FullDepartureRowProps {
  d: IDeparture;
  onOpen: () => void;
}

export default function FullDepartureRow({ d, onOpen }: FullDepartureRowProps) {
  const actual = new Date(d.actualDateTime);
  const timeStr = actual.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

  return (
    <button
      onClick={onOpen}
      aria-label={`${d.direction}, vertrekt ${timeStr}${d.delayMinutes > 0 ? `, ${d.delayMinutes} min vertraging` : ', op tijd'}${d.cancelled ? ', geannuleerd' : ''}. Klik voor reisdetails.`}
      style={{
        width: '100%', padding: '12px 0', display: 'flex', gap: 12, alignItems: 'center',
        borderBottom: '1px solid var(--line-row)', textAlign: 'left',
        background: 'transparent', transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--subtle)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Time column */}
      <div style={{ width: 48 }}>
        <div className="num" style={{
          fontSize: 16, fontWeight: 800,
          textDecoration: d.cancelled ? 'line-through' : 'none',
          color: d.cancelled ? 'var(--ink-cancel)' : 'var(--ink)',
        }}>
          {timeStr}
        </div>
        {d.delayMinutes > 0 && !d.cancelled && (
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--warn-accent)', marginTop: 2 }}>
            +{d.delayMinutes} min
          </div>
        )}
      </div>

      {/* Middle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{d.direction}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
          {d.trainCategory} {d.trainId ?? ''}{d.trackChanged ? ' · track changed' : ''}
        </div>
      </div>

      {/* Status */}
      <span style={{
        fontSize: 12, fontWeight: d.cancelled || d.delayMinutes > 0 ? 800 : 700, whiteSpace: 'nowrap',
        color: d.cancelled ? 'var(--bad)' : d.delayMinutes > 0 ? 'var(--warn-accent)' : 'var(--ok)',
      }}>
        {d.cancelled ? 'cancelled' : d.delayMinutes > 0 ? 'delayed' : 'on time'}
      </span>

      {/* Track badge */}
      <span style={{
        minWidth: 28, textAlign: 'center', padding: '2px 6px',
        border: '1.5px solid var(--line)', borderRadius: 7,
        fontSize: 12, fontWeight: 700, color: 'var(--ink)',
      }}>
        {d.cancelled ? '—' : d.actualTrack}
      </span>
    </button>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add app/_components/shared/NowPill.tsx app/_components/shared/CrowdingStrip.tsx app/_components/shared/DepartureRow.tsx app/_components/shared/FullDepartureRow.tsx
git commit -m "style: restyle shared components for transit redesign

Simplify CrowdingStrip to single bar style with hero/card variants.
Restyle DepartureRow and FullDepartureRow with category badges, track
badges, and transit-blue color scheme. Update NowPill via CSS."
```

---

### Task 5: Redesign RhythmView (Home screen)

**Files:**
- Modify: `app/_components/views/RhythmView.tsx`

**Interfaces:**
- Consumes: `ITweaks` (simplified, from Task 2), `CrowdingStrip` with `variant` prop (Task 4), `DepartureRow` (Task 4), `NowPill` (Task 4), CSS tokens (Task 1), `IconSwap` (Task 3)
- Produces: Redesigned home screen matching screenshots 1a (desktop) and 1b (mobile)

- [ ] **Step 1: Replace RhythmView entirely**

Replace the full content of `app/_components/views/RhythmView.tsx` with the redesigned version. This is a large file, so here is the complete replacement:

```tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { IDeparture, ITweaks } from '../../interfaces/interfaces';
import { generateDepartures } from '../../_utils/mock';
import { IconSwap } from '../icons/Icons';
import CrowdingStrip from '../shared/CrowdingStrip';
import DepartureRow from '../shared/DepartureRow';
import NowPill from '../shared/NowPill';

interface RhythmViewProps {
  tweaks: ITweaks;
  homeStation: { code: string; name: string } | null;
  workStation: { code: string; name: string } | null;
  onOpenJourney: (train: IDeparture, fromCode?: string) => void;
  onOpenStation: (station: { code: string; name: string }) => void;
}

const DEMO_BASELINE = {
  usualDuration: 27,
  historyWeeks: 12,
  onTimeRate: 0.89,
  avgCrowding: 0.62,
};

export default function RhythmView({ tweaks, homeStation, workStation, onOpenJourney }: RhythmViewProps) {
  const home = homeStation ?? { code: 'ASD', name: 'Amsterdam Centraal' };
  const work = workStation ?? { code: 'UT', name: 'Utrecht Centraal' };
  const [now, setNow] = useState(new Date());
  const [departures, setDepartures] = useState<IDeparture[] | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let active = true;
    let abortCtrl: AbortController | null = null;
    let hasData = false;

    const fetchData = async () => {
      if (!active || document.visibilityState !== 'visible') return;
      abortCtrl?.abort();
      const ctrl = new AbortController();
      abortCtrl = ctrl;
      try {
        const res = await fetch(`/api/departures/${home.code}`, { signal: ctrl.signal });
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            hasData = true;
            setDepartures(data);
            return;
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
      if (active && !hasData) setDepartures(generateDepartures(home.code, new Date()));
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
  }, [home.code]);

  const yourTrain = useMemo(() => {
    if (!departures) return null;
    return departures.find(d => (d.direction === work.name || d.destinationCode === work.code) && d.trainCategory === 'IC')
      ?? departures.find(d => d.direction === work.name || d.destinationCode === work.code)
      ?? departures[0];
  }, [departures, work.name, work.code]);

  const alternatives = useMemo(() => {
    if (!departures) return [];
    return departures.filter(d =>
      d.direction === work.name || d.destinationCode === work.code
    ).slice(0, 3);
  }, [departures, work.name, work.code]);

  const dateLabel = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const hour = now.getHours();
  const greeting = hour < 6 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const shortHome = home.name.replace(' Centraal', ' C');
  const shortWork = work.name.replace(' Centraal', ' C');

  return (
    <div className="view fade-up">
      {/* Masthead */}
      <div style={{ padding: '24px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>{dateLabel}</div>
          <h1 style={{ fontSize: 23, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{greeting}</h1>
        </div>
        <NowPill />
      </div>

      {/* Commute chip — mobile */}
      <div className="rhythm-commute-chip" style={{ padding: '0 18px 12px' }}>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', background: 'var(--card)', border: '1px solid var(--line)',
          borderRadius: 999, fontSize: 13, fontWeight: 600, color: 'var(--ink)',
        }}>
          {shortHome} <span style={{ color: 'var(--primary)' }}>→</span> {shortWork} <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>›</span>
        </button>
      </div>

      {/* Departures live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {departures ? `${departures.length} departures loaded` : ''}
      </div>

      {/* Desktop grid */}
      <div className="rhythm-grid">
        <div className="rhythm-col-l">
          {/* Hero card */}
          <div style={{ padding: '0 18px' }}>
            {yourTrain ? (
              <HeroCard train={yourTrain} home={home} now={now} onClick={() => onOpenJourney(yourTrain, home.code)} />
            ) : (
              <div className="card" style={{ padding: 20, height: 200, borderRadius: 20 }}>
                <div className="skeleton" style={{ height: 50, marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 20, width: '40%' }} />
              </div>
            )}
          </div>

          {/* Smart swap */}
          {yourTrain && yourTrain.delayMinutes >= 2 && (
            <SmartSwap train={yourTrain} alternatives={alternatives.slice(1)} />
          )}

          {/* Later today */}
          <LaterToday departures={departures} onOpen={d => onOpenJourney(d, home.code)} tweaks={tweaks} homeCode={home.code} />
        </div>

        <div className="rhythm-col-r">
          <BaselineBlock />
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}

/* ── Helper ── */

function quietestCar(crowding: number[]): number {
  let min = 1, idx = 0;
  crowding.forEach((c, i) => { if (c < min) { min = c; idx = i; } });
  return idx;
}

/* ── Hero Card ── */

function HeroCard({ train, home, now, onClick }: {
  train: IDeparture;
  home: { code: string; name: string };
  now: Date;
  onClick: () => void;
}) {
  const actual = new Date(train.actualDateTime);
  const planned = new Date(train.plannedDateTime);
  const minsTo = Math.max(0, Math.round((actual.getTime() - now.getTime()) / 60000));
  const late = train.delayMinutes;
  const timeStr = actual.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const plannedStr = planned.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const crowding = train.crowding ?? [];
  const quietIdx = crowding.length > 0 ? quietestCar(crowding) : -1;

  // Walk-by time: subtract 12 minutes from departure
  const walkBy = new Date(actual.getTime() - 12 * 60000);
  const walkByStr = walkBy.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

  return (
    <button onClick={onClick} aria-label={`Jouw trein naar ${train.direction}, vertrekt ${timeStr}${late > 0 ? `, ${late} minuten vertraging` : ', op tijd'}. Klik voor reisdetails.`} style={{
      width: '100%', textAlign: 'left', padding: 0,
      background: 'var(--primary-deep)', color: '#FFFFFF',
      borderRadius: 20, overflow: 'hidden', display: 'block', border: 'none',
    }}>
      {/* Top strip */}
      <div style={{ padding: '16px 18px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="eyebrow" style={{ color: 'var(--primary-muted)', letterSpacing: '0.1em' }}>YOUR NEXT TRAIN</span>
        <span style={{
          padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
          background: 'rgba(255,255,255,0.12)', color: '#FFFFFF',
        }}>
          {train.trainCategory} {train.trainId ?? ''}
        </span>
      </div>

      {/* Big time + track */}
      <div style={{ padding: '0 18px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="num" style={{ fontSize: 62, fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.03em' }}>
            {timeStr}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            {late > 0 && (
              <span style={{
                padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                background: 'var(--warn)', color: '#FFFFFF',
              }}>
                +{late} min
              </span>
            )}
            {late > 0 && (
              <span style={{ fontSize: 12, color: 'var(--primary-muted)', textDecoration: 'line-through' }}>
                plan {plannedStr}
              </span>
            )}
            {late === 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ok-light)' }}>on time</span>
            )}
          </div>
        </div>

        {/* Track box */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            border: '2px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19, fontWeight: 800,
          }}>
            {train.actualTrack}
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', marginTop: 3, color: 'var(--primary-muted)' }}>TRACK</span>
        </div>
      </div>

      {/* Destination + caption */}
      <div style={{ padding: '4px 18px 14px' }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>{train.direction}</div>
        <div style={{ fontSize: 12, color: 'var(--primary-muted)', marginTop: 3 }}>
          from {home.name} · leaves in {minsTo} min · walk by {walkByStr}
        </div>
      </div>

      {/* Crowding strip */}
      {crowding.length > 0 && (
        <div style={{ padding: '12px 18px 16px', borderTop: '1px solid rgba(255,255,255,0.14)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="eyebrow" style={{ color: 'var(--primary-muted)' }}>
              CROWDING · BOARD CAR {quietIdx + 1}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ok-light)' }}>
              {quietIdx < crowding.length / 2 ? 'Front is quietest' : 'Rear is quietest'}
            </span>
          </div>
          <CrowdingStrip crowding={crowding} variant="hero" recommendedCar={quietIdx} />
        </div>
      )}
    </button>
  );
}

/* ── Smart Swap ── */

function SmartSwap({ train, alternatives }: { train: IDeparture; alternatives: IDeparture[] }) {
  const best = alternatives[0];
  if (!best) return null;
  const bestTime = new Date(best.actualDateTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ padding: '12px 18px 0' }}>
      <div
        role="alert"
        style={{
          background: 'var(--warn-tint)', borderRadius: 15, padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 10, background: 'var(--warn)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IconSwap style={{ width: 18, height: 18, color: '#FFFFFF' }} />
        </div>
        <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>
          The <strong>{bestTime} {best.trainCategory}</strong> beats your delayed train and is emptier.
        </div>
        <button
          aria-label={`Wissel naar de ${bestTime} ${best.trainCategory}`}
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', padding: '4px 8px', whiteSpace: 'nowrap' }}
        >
          Swap
        </button>
      </div>
    </div>
  );
}

/* ── Baseline ── */

function BaselineBlock() {
  return (
    <div style={{ padding: '16px 18px 4px' }}>
      <h2 className="eyebrow" style={{ marginBottom: 10 }}>YOUR BASELINE · {DEMO_BASELINE.historyWeeks} WEEKS</h2>
      <div className="card" style={{ padding: 16, borderRadius: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <StatTile big={(DEMO_BASELINE.onTimeRate * 100).toFixed(0)} suffix="%" label="on time" />
          <StatTile big={String(DEMO_BASELINE.usualDuration)} suffix="m" label="avg ride" />
          <StatTile big={(DEMO_BASELINE.avgCrowding * 100).toFixed(0)} suffix="%" label="avg crowd" />
        </div>
      </div>
    </div>
  );
}

function StatTile({ big, suffix, label }: { big: string; suffix: string; label: string }) {
  return (
    <div style={{ background: 'var(--subtle)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
      <div className="num" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 1 }}>
        <span style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>{big}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

/* ── Later Today ── */

function LaterToday({ departures, onOpen, tweaks, homeCode }: { departures: IDeparture[] | null; onOpen: (d: IDeparture) => void; tweaks: ITweaks; homeCode: string }) {
  if (!departures) return null;
  const list = departures.slice(0, tweaks.verbosity === 'minimal' ? 3 : 6);
  return (
    <div style={{ padding: '16px 18px 4px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 className="eyebrow">LATER TODAY · {homeCode}</h2>
        <button style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>See all</button>
      </div>
      <div className="card" style={{ padding: '0 14px', borderRadius: 16 }}>
        {list.map(d => (
          <DepartureRow key={d.id} d={d} onClick={() => onOpen(d)} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `cd /Users/aijal000/code/transit && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add app/_components/views/RhythmView.tsx
git commit -m "style: redesign RhythmView with navy hero, smart swap, transit UI

Replace editorial serif hero with navy transit hero card (big time,
delay chip, track box, crowding strip). Add mobile commute chip.
Restyle smart swap as amber banner with swap icon. Restyle baseline
tiles and later-today list with card UI."
```

---

### Task 6: Redesign PulseView (Network Map)

**Files:**
- Modify: `app/_components/views/PulseView.tsx`

**Interfaces:**
- Consumes: CSS tokens (Task 1), `NowPill` (Task 4), `IconClose`, `IconArrow` from Icons.tsx
- Produces: Redesigned network map matching screenshot 1c

- [ ] **Step 1: Replace PulseView with redesigned version**

Replace `app/_components/views/PulseView.tsx` entirely. Key changes:
- Use precomputed geometry from `map-geometry.txt` (hardcoded constants) instead of `project()` calls
- SVG viewBox `0 0 420 540` with NL outline path, route lines, station dots, train dots
- Filter chips (All/Intercity/Sprinter/Delayed)
- Map in a white card with radius 20
- Disruption cards below map (instead of weather overlays)
- Remove WeatherGlyph, radialGradient defs, dot-grid pattern

```tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { IDeparture, IActiveTrain, IDisruption, ITweaks } from '../../interfaces/interfaces';
import { generateActiveTrains, generateDisruptions, STATIONS } from '../../_utils/mock';
import { IconClose, IconArrow } from '../icons/Icons';
import NowPill from '../shared/NowPill';

interface PulseViewProps {
  tweaks: ITweaks;
  onOpenJourney: (train: IDeparture) => void;
  onOpenStation: (station: { code: string; name: string; lat?: number; lng?: number }) => void;
}

// Precomputed from map-geometry.txt for 420×540 viewBox
const MAP_STATIONS: Record<string, [number, number]> = {
  ASD:[168,216.2],UT:[190.1,272],RTD:[122.8,303.8],GVC:[107.6,273.7],
  SHL:[153.5,229.6],EHV:[228.8,396.7],LEDN:[124.1,257.2],HLM:[140.5,214.5],
  AMF:[217.8,259.8],ZL:[293.1,192],GN:[342.8,55.8],MT:[252.6,511.1],
  BD:[155.4,367.3],HT:[209.3,349],
};

const MAP_NL_PATH = 'M5.3,443.6 L21,385.7 L42,376.1 L94.5,405 L136.5,395.4 L183.8,395.4 L199.5,443.6 L262.5,520.7 L294,511.1 L283.5,443.6 L304.5,385.7 L325.5,318.2 L399,241.1 L409.5,173.6 L367.5,106.1 L383.3,57.9 L409.5,38.6 L357,0 L273,9.6 L199.5,19.3 L147,77.1 L183.8,125.4 L152.3,192.9 L131.3,221.8 L94.5,270 L63,337.5 L21,376.1 Z';

const MAP_ROUTES: [number,number,number,number][] = [
  [168,216.2,190.1,272],[190.1,272,228.8,396.7],[228.8,396.7,252.6,511.1],
  [168,216.2,153.5,229.6],[153.5,229.6,124.1,257.2],[124.1,257.2,107.6,273.7],
  [107.6,273.7,122.8,303.8],[122.8,303.8,155.4,367.3],[155.4,367.3,228.8,396.7],
  [168,216.2,217.8,259.8],[217.8,259.8,190.1,272],[217.8,259.8,293.1,192],
  [293.1,192,342.8,55.8],[122.8,303.8,190.1,272],[168,216.2,140.5,214.5],
  [124.1,257.2,153.5,229.6],[190.1,272,209.3,349],[209.3,349,228.8,396.7],
  [122.8,303.8,153.5,229.6],
];

const DISRUPTION_ZONES = [
  { cx: 171, cy: 227, r: 59, type: 'active' as const },
  { cx: 124, cy: 257.3, r: 42, type: 'resolved' as const },
];

const MAJOR_LABELS: Record<string, string> = {
  ASD: 'Amsterdam C', UT: 'Utrecht C', RTD: 'Rotterdam C',
  GVC: 'Den Haag C', EHV: 'Eindhoven', GN: 'Groningen', ZL: 'Zwolle',
};

type Filter = 'all' | 'ic' | 'spr' | 'delayed';

export default function PulseView({ onOpenJourney, onOpenStation }: PulseViewProps) {
  const [trains, setTrains] = useState<IActiveTrain[]>(() => generateActiveTrains(40));
  const [disruptions] = useState<IDisruption[]>(() => generateDisruptions());
  const [selected, setSelected] = useState<IActiveTrain | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  useEffect(() => {
    fetch('/api/disruptions').then(r => r.json()).catch(() => null);
  }, []);

  useEffect(() => {
    lastTsRef.current = performance.now();
    const loop = (ts: number) => {
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      setTrains(prev => prev.map(tr => {
        let t = tr.t + tr.speed * dt;
        if (t > 1) t = 0;
        return { ...tr, t };
      }));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const filteredTrains = trains.filter(tr => {
    if (filter === 'ic') return tr.cat === 'IC' || tr.cat === 'ICD';
    if (filter === 'spr') return tr.cat === 'SPR';
    if (filter === 'delayed') return tr.delayMin >= 3;
    return true;
  });

  const activeDisruptions = disruptions.filter(d => d.severity > 0.3);

  return (
    <div className="view fade-up" style={{ paddingBottom: 0 }}>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {activeDisruptions.map(d => d.label).join(', ')}
      </div>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {selected ? `Trein ${selected.id} geselecteerd: ${selected.from.name} naar ${selected.to.name}${selected.delayMin > 0 ? `, ${selected.delayMin} min vertraging` : ''}.` : ''}
      </div>

      {/* Header */}
      <div style={{ padding: '24px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em' }}>Network</h1>
        <NowPill label={`${trains.length} trains live`} />
      </div>

      {/* Filter chips */}
      <div style={{ padding: '0 18px 12px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {([['all','All'],['ic','Intercity'],['spr','Sprinter'],['delayed','Delayed']] as [Filter,string][]).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} style={{
            padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            background: filter === id ? (id === 'delayed' ? 'transparent' : 'var(--ink)') : 'var(--card)',
            color: filter === id ? (id === 'delayed' ? 'var(--warn-accent)' : '#FFFFFF') : (id === 'delayed' ? 'var(--warn-accent)' : 'var(--ink-2)'),
            border: `1px solid ${filter === id && id !== 'delayed' ? 'var(--ink)' : id === 'delayed' ? 'var(--warn-border)' : 'var(--line)'}`,
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Map + disruptions */}
      <div className="pulse-map-layout">
        <div className="pulse-map-area" style={{ position: 'relative', padding: '0 18px' }}>
          <div className="card" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <svg
              viewBox="0 0 420 540"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Kaart van het Nederlandse spoornetwerk met live treinposities en verstoringen."
              style={{ width: '100%', height: 'auto', display: 'block' }}
            >
              {/* NL outline */}
              <path d={MAP_NL_PATH} fill="var(--map-land)" stroke="var(--map-stroke)" strokeWidth="1.5" />

              {/* Disruption zones */}
              {DISRUPTION_ZONES.map((z, i) => (
                <circle key={i} cx={z.cx} cy={z.cy} r={z.r}
                  fill={z.type === 'active' ? 'rgba(255,179,0,0.13)' : 'rgba(90,107,130,0.12)'}
                  stroke={z.type === 'active' ? 'var(--warn)' : 'var(--ink-4)'}
                  strokeWidth="1.5" strokeDasharray="4 4" />
              ))}

              {/* Route lines */}
              {MAP_ROUTES.map(([x1,y1,x2,y2], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="var(--map-route)" strokeWidth="2.5" strokeLinecap="round" />
              ))}

              {/* Stations */}
              {Object.entries(MAP_STATIONS).map(([code, [x, y]]) => {
                const s = STATIONS.find(s => s.code === code);
                return (
                  <g key={code}
                    role="button" tabIndex={0}
                    aria-label={`Station ${s?.name ?? code}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => s && onOpenStation(s)}
                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && s) { e.preventDefault(); onOpenStation(s); } }}
                  >
                    <circle cx={x} cy={y} r={3.5} fill="var(--ink)" />
                    {MAJOR_LABELS[code] && (
                      <text x={x + 8} y={y + 4} fontSize="10" fontWeight="700" fill="var(--ink)" style={{ pointerEvents: 'none' }}>
                        {MAJOR_LABELS[code]}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Trains */}
              {filteredTrains.map(tr => {
                const fp = MAP_STATIONS[tr.from.code];
                const tp = MAP_STATIONS[tr.to.code];
                if (!fp || !tp) return null;
                const x = fp[0] + (tp[0] - fp[0]) * tr.t;
                const y = fp[1] + (tp[1] - fp[1]) * tr.t;
                const isDelayed = tr.delayMin >= 3;
                const isSel = selected?.id === tr.id;
                return (
                  <g key={tr.id}
                    role="button" tabIndex={0}
                    aria-label={`Trein ${tr.id} (${tr.cat}): ${tr.from.name} → ${tr.to.name}${tr.delayMin > 0 ? `, ${tr.delayMin} min vertraging` : ', op tijd'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelected(tr)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(tr); } }}
                  >
                    <circle cx={x} cy={y} r={4.5}
                      fill={isDelayed ? 'var(--warn)' : 'var(--primary)'}
                      stroke="#FFFFFF" strokeWidth="1.5" />
                    {isSel && <circle cx={x} cy={y} r={10} fill="none" stroke={isDelayed ? 'var(--warn)' : 'var(--primary)'} strokeWidth="1.5" />}
                  </g>
                );
              })}

              {/* Legend */}
              <g transform="translate(16, 510)">
                <circle cx={0} cy={0} r={4} fill="var(--primary)" />
                <text x={8} y={4} fontSize="10" fontWeight="600" fill="var(--ink-3)">on time</text>
                <circle cx={65} cy={0} r={4} fill="var(--warn)" />
                <text x={73} y={4} fontSize="10" fontWeight="600" fill="var(--ink-3)">delayed</text>
              </g>
            </svg>

            {/* Selected train card */}
            {selected && (
              <div style={{
                position: 'absolute', left: 30, right: 30, bottom: 24,
                background: 'var(--card)', border: '1px solid var(--line)',
                borderRadius: 14, padding: 14,
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                animation: 'fadeUp 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 2 }}>Train {selected.id.toUpperCase()} · {selected.cat}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                      {selected.from.name} <span style={{ color: 'var(--ink-3)' }}>→</span> {selected.to.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
                      {selected.delayMin > 0 ? `+${selected.delayMin} min late` : 'On time'} · {(selected.t * 100).toFixed(0)}% along route
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} aria-label="Sluit treinkaart" style={{ padding: 4, color: 'var(--ink-3)' }}>
                    <IconClose style={{ width: 18, height: 18 }} />
                  </button>
                </div>
                <button
                  onClick={() => {
                    onOpenJourney({
                      id: selected.id, direction: selected.to.name,
                      destinationCode: selected.to.code, trainCategory: selected.cat,
                      trainId: selected.id, delayMinutes: selected.delayMin,
                      actualTrack: '—', plannedTrack: '—', trackChanged: false,
                      plannedDateTime: new Date().toISOString(),
                      actualDateTime: new Date().toISOString(), cancelled: false,
                    });
                  }}
                  style={{
                    marginTop: 10, width: '100%', padding: '10px 12px',
                    background: 'var(--primary)', color: '#FFFFFF',
                    borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 13, fontWeight: 700,
                  }}
                >
                  <span>View journey</span>
                  <IconArrow style={{ width: 15, height: 15 }} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Disruption panel */}
        <div className="pulse-side-panel" style={{ padding: '16px 18px' }}>
          {disruptions.filter(d => d.severity > 0).map(d => (
            <div key={d.id} style={{
              background: 'var(--card)', borderRadius: 14, padding: 14, marginBottom: 10,
              border: `1px solid ${d.severity > 0.3 ? 'var(--warn-border)' : 'var(--line)'}`,
              borderLeft: d.severity > 0.3 ? '3px solid var(--warn)' : undefined,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{d.label}</div>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--warn-accent)', whiteSpace: 'nowrap' }}>{d.impact}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.4 }}>{d.message}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/views/PulseView.tsx
git commit -m "style: redesign PulseView with card map, filter chips, disruption cards

Replace weather-overlay map with card-based SVG map using precomputed
geometry. Add filter chips (All/Intercity/Sprinter/Delayed). Replace
weather glyphs with disruption cards. Use transit-blue train dots
and dashed disruption circles."
```

---

### Task 7: Redesign JourneyView

**Files:**
- Modify: `app/_components/views/JourneyView.tsx`

**Interfaces:**
- Consumes: CSS tokens (Task 1), `ITweaks` simplified (Task 2), `CrowdingStrip` with variant (Task 4), `IconBack` (Task 3)
- Produces: Redesigned journey view matching screenshot 1d

- [ ] **Step 1: Replace JourneyView**

Replace `app/_components/views/JourneyView.tsx` entirely:

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
  onNavigate: (tab: 'rhythm' | 'search') => void;
}

function quietestIdx(crowding: number[]): number {
  let min = 1, idx = 0;
  crowding.forEach((c, i) => { if (c < min) { min = c; idx = i; } });
  return idx;
}

export default function JourneyView({ train, fromCode, onBack, onNavigate }: JourneyViewProps) {
  const [stops, setStops] = useState<IStop[] | null>(null);
  const [stopsFailed, setStopsFailed] = useState(false);

  const rawTrainId = train?.trainId;
  const trainId = rawTrainId != null && /^\d+$/.test(String(rawTrainId)) ? String(rawTrainId) : null;

  useEffect(() => {
    if (!trainId) {
      queueMicrotask(() => { setStops(null); setStopsFailed(true); });
      return;
    }
    queueMicrotask(() => { setStops(null); setStopsFailed(false); });

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

  if (!train) {
    return (
      <div className="view fade-up">
        <div style={{ padding: '18px 18px 6px' }}>
          <button onClick={onBack} style={{
            width: 34, height: 34, borderRadius: 17, background: 'var(--card)',
            border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconBack aria-hidden="true" style={{ width: 16, height: 16, color: 'var(--ink)' }} />
          </button>
        </div>
        <div style={{ padding: '16px 18px' }}>
          <h1 style={{ fontSize: 19, fontWeight: 800 }}>Geen actieve reis</h1>
          <p style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: 360 }}>
            Kies een trein in{' '}
            <button onClick={() => onNavigate('rhythm')} style={{ color: 'var(--primary)', fontWeight: 700, padding: 0, fontSize: 13 }}>Home</button>
            {' '}of{' '}
            <button onClick={() => onNavigate('search')} style={{ color: 'var(--primary)', fontWeight: 700, padding: 0, fontSize: 13 }}>Stations</button>
            {' '}om hem hier te volgen.
          </p>
        </div>
      </div>
    );
  }

  const hereIdx = stops && fromCode ? stops.findIndex(s => s.code === fromCode) : -1;
  const crowding = train.crowding;
  const quietCar = crowding && crowding.length > 0 ? quietestIdx(crowding) : -1;
  const crowdPct = crowding && crowding.length > 0 ? Math.round(crowding[quietCar] * 100) : null;

  return (
    <div className="view fade-up">
      {/* Header */}
      <div style={{ padding: '18px 18px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{
          width: 34, height: 34, borderRadius: 17, background: 'var(--card)',
          border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IconBack aria-hidden="true" style={{ width: 16, height: 16, color: 'var(--ink)' }} />
        </button>

        <span style={{ padding: '4px 10px', borderRadius: 999, background: 'var(--primary-tint)', color: 'var(--primary)', fontSize: 11, fontWeight: 700 }}>
          {train.trainCategory} {train.trainId ?? ''}
        </span>
        <span className="dot live" style={{ marginLeft: -4 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ok)' }}>live</span>

        <h1 style={{ flex: 1, fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>
          to {train.direction}
        </h1>

        {/* Track box */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            border: '1.5px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800,
          }}>
            {train.actualTrack}
          </div>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 2 }}>TRACK</span>
        </div>
      </div>

      {/* Where to stand */}
      {crowding && crowding.length > 0 && (
        <div style={{ padding: '0 18px 12px' }}>
          <div className="card" style={{ padding: 16, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="eyebrow">WHERE TO STAND</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: crowdPct! < 40 ? 'var(--ok)' : crowdPct! < 75 ? 'var(--warn-accent)' : 'var(--bad)' }}>
                Car {quietCar + 1} · {crowdPct}% full
              </span>
            </div>

            {/* Train diagram */}
            <div style={{ display: 'flex', gap: 3 }}>
              {crowding.map((c, i) => {
                const isRec = i === quietCar;
                const isEnd = i === 0 || i === crowding.length - 1;
                return (
                  <div key={i} style={{
                    flex: 1, height: 34, position: 'relative',
                    borderRadius: isEnd ? (i === 0 ? '8px 4px 4px 8px' : '4px 8px 8px 4px') : 4,
                    background: isRec ? 'var(--ok-tint)' : '#CBD7E8',
                    border: isRec ? '2px solid var(--ok)' : '1px solid var(--line)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {/* Crowd fill bar */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: `${Math.max(10, c * 100)}%`,
                      background: isRec ? 'var(--ok-light)' : c >= 0.75 ? 'var(--warn-accent)' : 'var(--ink-4)',
                      borderRadius: 'inherit',
                    }} />
                    <span style={{ position: 'relative', fontSize: 11, fontWeight: 800, color: 'var(--ink)' }}>{i + 1}</span>
                  </div>
                );
              })}
            </div>

            {/* Platform zones */}
            <div style={{ display: 'flex', marginTop: 10, gap: 0 }}>
              {['A', 'B', 'C', 'D'].map((zone, zi) => {
                const isRec = quietCar >= (crowding.length / 4) * zi && quietCar < (crowding.length / 4) * (zi + 1);
                return (
                  <div key={zone} style={{
                    flex: 1, textAlign: 'center', paddingTop: 6,
                    borderTop: `2px solid ${isRec ? 'var(--ok)' : 'var(--line)'}`,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: isRec ? 'var(--ok)' : 'var(--ink-3)' }}>
                      Zone {zone}{isRec ? ' · here' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stops */}
      <div style={{ padding: '0 18px' }}>
        <div className="card" style={{ padding: 16, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="eyebrow">STOPS</span>
            {train.delayMinutes > 0 && (
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--warn-accent)' }}>running +{train.delayMinutes} min</span>
            )}
          </div>

          {stops ? (
            <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {stops.map((s, i) => (
                <li key={`${s.code}-${i}`}>
                  <StopRow stop={s} here={i === hereIdx} last={i === stops.length - 1} isPast={i <= hereIdx} />
                </li>
              ))}
            </ol>
          ) : stopsFailed ? (
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Stops unavailable</div>
          ) : (
            <Loader />
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ padding: '16px 18px', display: 'flex', gap: 10 }}>
        <button style={{
          flex: 1, padding: 14, borderRadius: 13, fontSize: 14, fontWeight: 700,
          background: 'var(--primary)', color: '#FFFFFF', textAlign: 'center',
        }}>
          Set arrival alert
        </button>
        <button style={{
          flex: 1, padding: 14, borderRadius: 13, fontSize: 14, fontWeight: 700,
          background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--line)', textAlign: 'center',
        }}>
          Share ETA
        </button>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}

function StopRow({ stop, here, last, isPast }: { stop: IStop; here: boolean; last: boolean; isPast: boolean }) {
  const fmt = (iso: string) => new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const delayed = new Date(stop.actualTime).getTime() !== new Date(stop.plannedTime).getTime();
  const delayMs = new Date(stop.actualTime).getTime() - new Date(stop.plannedTime).getTime();
  const delayMin = Math.round(delayMs / 60000);

  return (
    <div style={{ display: 'flex', gap: 14, position: 'relative', minHeight: 48 }}>
      {/* Timeline */}
      <div style={{ position: 'relative', width: 20, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {!last && (
          <div style={{
            position: 'absolute', left: '50%', top: 16, bottom: 0, width: 2, marginLeft: -1,
            background: isPast || here ? 'var(--primary)' : 'var(--line)',
          }} />
        )}
        <div style={{
          position: 'relative', marginTop: 6,
          width: here ? 14 : 10, height: here ? 14 : 10, borderRadius: '50%',
          background: here || isPast ? 'var(--primary)' : 'var(--card)',
          border: here ? 'none' : `2px solid ${isPast ? 'var(--primary)' : 'var(--line)'}`,
          boxShadow: here ? '0 0 0 4px var(--primary-tint)' : 'none',
        }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: last ? 0 : 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 14, fontWeight: here ? 800 : 700, color: 'var(--ink)' }}>{stop.name}</span>
          <span className="num" style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{fmt(stop.actualTime)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            {stop.status === 'ORIGIN' ? 'Departure' : stop.status === 'DESTINATION' ? 'Arrival' : `Track ${stop.track}`}
            {stop.track && stop.status !== 'DESTINATION' ? ` · track ${stop.track}` : ''}
          </span>
          {delayed && delayMin > 0 && (
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--warn-accent)' }}>+{delayMin}</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/views/JourneyView.tsx
git commit -m "style: redesign JourneyView with where-to-stand card and stop timeline

Replace editorial journey header with circular back button, badge,
and track box. Add where-to-stand card with train diagram and
platform zones. Restyle stop timeline with blue dots and connectors.
Add footer action buttons."
```

---

### Task 8: Redesign StationView

**Files:**
- Modify: `app/_components/views/StationView.tsx`

**Interfaces:**
- Consumes: CSS tokens (Task 1), `FullDepartureRow` (Task 4), `IconSearch`, `IconClose`, `IconBack` (Task 3)
- Produces: Redesigned station board matching screenshot 1e

- [ ] **Step 1: Replace StationView**

Replace `app/_components/views/StationView.tsx` entirely:

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { IDeparture, ITweaks } from '../../interfaces/interfaces';
import { generateDepartures, STATIONS } from '../../_utils/mock';
import { IconBack, IconSearch } from '../icons/Icons';
import FullDepartureRow from '../shared/FullDepartureRow';
import NowPill from '../shared/NowPill';

interface StationObj {
  code: string;
  name: string;
  lat?: number;
  lng?: number;
}

interface StationViewProps {
  station: StationObj | null;
  tweaks: ITweaks;
  onBack: () => void;
  onOpenJourney: (train: IDeparture, fromCode?: string) => void;
}

export function StationSearch({ onBack, onPick }: { onBack: () => void; onPick: (s: StationObj) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<StationObj[]>(STATIONS.slice(0, 8));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (q.length < 1) {
      queueMicrotask(() => setResults(STATIONS.slice(0, 8)));
      return;
    }
    const lo = q.toLowerCase();
    const local = STATIONS.filter(s => s.name.toLowerCase().includes(lo) || s.code.toLowerCase().includes(lo)).slice(0, 10);
    queueMicrotask(() => setResults(local));

    let cancelled = false;
    if (q.length >= 2) {
      fetch(`/api/stations?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(data => { if (!cancelled && Array.isArray(data) && data.length > 0) setResults(data); })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [q]);

  return (
    <div className="view fade-up">
      <div style={{ padding: '24px 18px 12px' }}>
        <h1 style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em' }}>Stations</h1>
      </div>

      {/* Search field */}
      <div style={{ padding: '0 18px' }}>
        <div className="card" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 14,
        }}>
          <IconSearch aria-hidden="true" style={{ width: 18, height: 18, color: 'var(--ink-4)', flexShrink: 0 }} />
          <label htmlFor="station-search" className="sr-only">Search stations</label>
          <input
            id="station-search"
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search stations..."
            style={{
              flex: 1, background: 'transparent', border: 0,
              fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          {(q || focused) && (
            <button onClick={() => setQ('')} style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete chips */}
      {q.length > 0 && results.length > 0 && (
        <div style={{ padding: '10px 18px 0', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {results.slice(0, 4).map(s => (
            <button key={s.code} onClick={() => onPick(s)} style={{
              padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
              background: 'var(--primary-tint)', color: 'var(--primary)',
              border: 'none',
            }}>
              {s.code} · {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Station list */}
      <div style={{ padding: '16px 18px 0' }}>
        {results.map(s => (
          <button key={s.code} onClick={() => onPick(s)} aria-label={`${s.name} (${s.code})`} style={{
            width: '100%', padding: '12px 0', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', borderBottom: '1px solid var(--line-row)', textAlign: 'left',
            background: 'transparent', transition: 'background 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--subtle)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ fontSize: 15, fontWeight: 700 }}>{s.name}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{s.code}</span>
          </button>
        ))}
      </div>
      <div style={{ height: 80 }} />
    </div>
  );
}

export default function StationView({ station, tweaks, onBack, onOpenJourney }: StationViewProps) {
  const [departures, setDepartures] = useState<IDeparture[] | null>(null);

  useEffect(() => {
    if (!station) return;
    queueMicrotask(() => setDepartures(null));
    let active = true;
    let abortCtrl: AbortController | null = null;
    let hasData = false;

    const fetchData = async () => {
      if (!active || document.visibilityState !== 'visible') return;
      abortCtrl?.abort();
      const ctrl = new AbortController();
      abortCtrl = ctrl;
      try {
        const res = await fetch(`/api/departures/${station.code}`, { signal: ctrl.signal });
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            hasData = true;
            setDepartures(data);
            return;
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
      if (active && !hasData) setDepartures(generateDepartures(station.code, new Date()));
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
  }, [station?.code]);

  if (!station) return null;

  const now = new Date();
  const updatedStr = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="view fade-up">
      {/* Header */}
      <div style={{ padding: '18px 18px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{
          width: 34, height: 34, borderRadius: 17, background: 'var(--card)',
          border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IconBack aria-hidden="true" style={{ width: 16, height: 16, color: 'var(--ink)' }} />
        </button>
      </div>

      {/* Station info */}
      <div style={{ padding: '12px 18px 0' }}>
        <h1 style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>{station.name}</h1>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>updated {updatedStr}</span>
          <NowPill label="live board" />
        </div>
      </div>

      {/* Departures live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {departures ? `${departures.length} departures loaded` : ''}
      </div>

      {/* Board */}
      <div style={{ padding: '16px 18px 0' }}>
        <div className="card" style={{ padding: '0 14px', borderRadius: 16 }}>
          {departures ? departures.map(d => (
            <FullDepartureRow key={d.id} d={d} onOpen={() => onOpenJourney(d, station.code)} />
          )) : (
            <div aria-busy="true" aria-label="Vertrektijden laden…">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--line-row)' }}>
                  <div className="skeleton" style={{ height: 18, width: 50, marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 16, width: '50%' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/views/StationView.tsx
git commit -m "style: redesign StationView with search field, chips, and board card

Replace editorial station header with clean search field and
autocomplete chips. Restyle station board as card with
FullDepartureRow rows. Add live board pill."
```

---

### Task 9: Final cleanup and build verification

**Files:**
- Possibly modify: any files with remaining type errors or broken references

**Interfaces:**
- Consumes: All previous tasks
- Produces: Clean build, all views rendering correctly

- [ ] **Step 1: Type-check the full project**

Run: `cd /Users/aijal000/code/transit && npx tsc --noEmit`

Fix any remaining type errors. Common issues:
- Components still passing `verbose` or `crowdingStyle` props to components that no longer accept them
- References to `tweaks.crowdingStyle` or `tweaks.accent` in views
- `ACCENT_MAP` import missing (should have been removed in Task 2)

- [ ] **Step 2: Build the project**

Run: `cd /Users/aijal000/code/transit && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Remove unused SCSS modules if empty**

Check `app/styles/Home.module.scss` — if it only contains styles for the old search form or other unused code, delete it. Keep `Loader.module.scss` (still used by `Loader.tsx`).

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve type errors and clean up unused code after redesign"
```

---
