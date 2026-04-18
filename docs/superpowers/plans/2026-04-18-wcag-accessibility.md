# WCAG 2.2 Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the Pulse transit app to WCAG 2.2 AA throughout, with AAA where cost-free (reduced-motion, extended contrast on body copy).

**Architecture:** Pure markup/CSS changes — no new components, no data-layer touches. Colour tokens land first (Task 1) so later tasks can reference them. Heading elements use `font: inherit` reset to prevent browser defaults from changing visual appearance. Focus trap for TweaksPanel is the only non-trivial logic change.

**Tech Stack:** Next.js 16 App Router, TypeScript, OKLCH CSS tokens, React hooks (useRef/useEffect for focus trap)

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `app/globals.css` | Modify | Token values, `.sr-only`, heading reset, `:focus-visible`, reduced-motion |
| `app/page.tsx` | Modify | `<main id="main-content" tabIndex={-1}>` |
| `app/_components/TabBar.tsx` | Modify | `aria-label` on nav, `role="tablist"` wrapper, `role="tab"` + `aria-selected` + `aria-hidden` on each button |
| `app/_components/TweaksPanel.tsx` | Modify | `role="dialog"`, focus trap, `role="radiogroup"` + `role="radio"` + `aria-checked`, swatch `aria-label` + `aria-pressed`, close button label |
| `app/_components/shared/CrowdingStrip.tsx` | Modify | `sr-only` summary span |
| `app/_components/shared/DepartureRow.tsx` | Modify | `aria-hidden` on arrow icon, `--bad-text` token |
| `app/_components/shared/FullDepartureRow.tsx` | Modify | `aria-hidden` on arrow icon, `--ok-text` / `--bad-text` tokens |
| `app/_components/views/RhythmView.tsx` | Modify | `<h1>` / `<h2>` headings, departures live region, delay live region in YourTrainCard, `aria-hidden` on AnomalyBlock arrow |
| `app/_components/views/StationView.tsx` | Modify | `<h1>` station name, departures live region, search `<label>` + `id`, `aria-hidden` on back/close icons, `aria-label` on clear button |
| `app/_components/views/JourneyView.tsx` | Modify | `<h1>` / `<h2>` headings, `aria-hidden` on PlatformDiagram, sparkline `role="img"` + `aria-label`, delay text token, `aria-hidden` on back icon |
| `app/_components/views/PulseView.tsx` | Modify | `<h1>` / `<h2>` headings, reduced-motion guard on rAF, `--ok-text` / `--warn-text` on impact text, close button `aria-label` + `aria-hidden` on icon |

---

## Task 1: CSS foundation

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Update ink-3 and add semantic text tokens**

In `app/globals.css`, inside `:root { }`, change `--ink-3` and add the three `*-text` tokens:

```css
:root {
  --bg:        oklch(0.975 0.012 85);
  --bg-2:      oklch(0.955 0.015 82);
  --bg-3:      oklch(0.935 0.02 80);
  --ink:       oklch(0.18 0.01 60);
  --ink-2:     oklch(0.40 0.01 60);
  --ink-3:     oklch(0.42 0.01 60);   /* was 0.60 — darkened for AA contrast */
  --line:      oklch(0.85 0.015 75);
  --line-2:    oklch(0.90 0.015 75);
  --accent:    oklch(0.60 0.17 45);
  --accent-dim:oklch(0.60 0.17 45 / 0.15);
  --ok:        oklch(0.58 0.09 150);
  --warn:      oklch(0.68 0.15 80);
  --bad:       oklch(0.55 0.18 25);
  --ok-text:   oklch(0.42 0.10 150);
  --warn-text: oklch(0.48 0.14 75);
  --bad-text:  oklch(0.42 0.16 25);

  --radius: 14px;
  --radius-lg: 22px;
  --sidebar-w: 220px;
}
```

Inside `[data-theme="dark"] { }`, change `--ink-3` and add the dark-mode text tokens:

```css
[data-theme="dark"] {
  --bg:        oklch(0.16 0.008 260);
  --bg-2:      oklch(0.20 0.01 260);
  --bg-3:      oklch(0.24 0.012 260);
  --ink:       oklch(0.96 0.006 85);
  --ink-2:     oklch(0.76 0.01 85);
  --ink-3:     oklch(0.62 0.01 85);   /* was 0.56 — adjusted for dark bg */
  --line:      oklch(0.30 0.01 260);
  --line-2:    oklch(0.26 0.01 260);
  --accent:    oklch(0.72 0.17 55);
  --accent-dim:oklch(0.72 0.17 55 / 0.18);
  --ok:        oklch(0.75 0.11 150);
  --warn:      oklch(0.80 0.15 80);
  --bad:       oklch(0.68 0.18 25);
  --ok-text:   oklch(0.78 0.11 150);
  --warn-text: oklch(0.82 0.13 75);
  --bad-text:  oklch(0.78 0.15 25);
}
```

- [ ] **Step 2: Add `.sr-only` utility and heading reset after the `a { }` reset**

Find this line in `app/globals.css`:
```css
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
a { color: inherit; text-decoration: none; }
```

Replace with:
```css
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
a { color: inherit; text-decoration: none; }
h1, h2, h3, h4, h5, h6 { font: inherit; }

.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
```

The `h1, h2, h3, h4, h5, h6 { font: inherit; }` reset prevents browser default heading styles (bold, large font-size) from overriding the `className`-driven styles we'll apply in later tasks.

- [ ] **Step 3: Add `:focus-visible` ring after the `.now-pill` block**

Find this in `app/globals.css`:
```css
/* ── Tweaks panel ── */
```

Before that comment, add:
```css
/* ── Focus ring ── */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 4px;
}
```

- [ ] **Step 4: Add reduced-motion overrides after the `.fade-up` keyframe block**

Find this in `app/globals.css`:
```css
/* ── Chip ── */
```

Before that comment, add:
```css
/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .fade-up { animation: none; }
  .skeleton { animation: none; opacity: 0.55; }
  @keyframes pulseDot { 0%, 100% { box-shadow: none; } }
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. (CSS changes don't affect TS.)

- [ ] **Step 6: Commit**

```bash
git add app/globals.css
git commit -m "feat(a11y): update contrast tokens, add sr-only, focus-visible, reduced-motion"
```

---

## Task 2: Page landmark and TabBar roles

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/_components/TabBar.tsx`

- [ ] **Step 1: Add id and tabIndex to the main element in page.tsx**

In `app/page.tsx`, find:
```tsx
      {/* ── Main content ─────────────────────────────────── */}
      <main className="pulse-main">
```

Replace with:
```tsx
      {/* ── Main content ─────────────────────────────────── */}
      <main id="main-content" tabIndex={-1} className="pulse-main">
```

`tabIndex={-1}` allows the element to receive programmatic focus (e.g. from skip links) without appearing in the natural tab order.

- [ ] **Step 2: Update TabBar with nav label, tablist wrapper, and tab roles**

Replace the entire contents of `app/_components/TabBar.tsx` with:

```tsx
'use client';

import React from 'react';
import { IconRhythm, IconPulse, IconJourney, IconSearch } from './icons/Icons';

type Tab = 'rhythm' | 'pulse' | 'journey' | 'search';

interface TabBarProps {
  tab: Tab;
  hasJourney: boolean;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'rhythm',  label: 'Rhythm',  Icon: IconRhythm  },
  { id: 'pulse',   label: 'Pulse',   Icon: IconPulse   },
  { id: 'journey', label: 'Journey', Icon: IconJourney },
  { id: 'search',  label: 'Search',  Icon: IconSearch  },
];

export default function TabBar({ tab, hasJourney, onTabChange }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="Main navigation">
      <div role="tablist">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls="main-content"
            data-active={tab === id}
            onClick={() => onTabChange(id === 'journey' ? (hasJourney ? 'journey' : 'rhythm') : id)}
          >
            <Icon aria-hidden="true" /><span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/_components/TabBar.tsx
git commit -m "feat(a11y): add main landmark, tablist/tab roles, aria-selected on TabBar"
```

---

## Task 3: TweaksPanel — dialog role, focus trap, radio roles

**Files:**
- Modify: `app/_components/TweaksPanel.tsx`

This is the most complex task. We add: `role="dialog"`, a focus trap (Tab/Shift+Tab cycle, Escape to close, focus restoration), `role="radiogroup"` + `role="radio"` on segmented controls, `aria-label` + `aria-pressed` on colour swatches, and `aria-label` on the close button.

- [ ] **Step 1: Replace the entire TweaksPanel.tsx**

```tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { ITweaks } from '../interfaces/interfaces';
import { IconClose } from './icons/Icons';

const ACCENT_MAP: Record<string, string> = {
  orange: 'oklch(0.60 0.17 45)',
  cobalt: 'oklch(0.55 0.19 265)',
  sage:   'oklch(0.58 0.13 155)',
  plum:   'oklch(0.48 0.18 330)',
};

interface TweaksPanelProps {
  tweaks: ITweaks;
  onChange: (key: keyof ITweaks, value: string) => void;
  onClose: () => void;
}

export default function TweaksPanel({ tweaks, onChange, onClose }: TweaksPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap + Escape to close + focus restoration on unmount
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (!panel) return;

    // Move focus to first focusable element inside the panel
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
    focusable[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    panel.addEventListener('keydown', handleKeyDown);
    return () => {
      panel.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();   // restore focus to trigger element on close
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="tweaks"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tweaks-title"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div id="tweaks-title" className="eyebrow">Tweaks</div>
        <button onClick={onClose} style={{ color: 'var(--ink-3)' }} aria-label="Close tweaks">
          <IconClose style={{ width: 16, height: 16 }} aria-hidden="true" />
        </button>
      </div>

      <TweakRow label="Theme">
        <Segmented
          label="Theme"
          value={tweaks.theme}
          onChange={v => onChange('theme', v)}
          options={[['light', 'Light'], ['dark', 'Dark']]}
        />
      </TweakRow>

      <TweakRow label="Verbosity">
        <Segmented
          label="Verbosity"
          value={tweaks.verbosity}
          onChange={v => onChange('verbosity', v)}
          options={[['minimal', 'Minimal'], ['rich', 'Data-rich']]}
        />
      </TweakRow>

      <TweakRow label="Crowding display">
        <Segmented
          label="Crowding display"
          value={tweaks.crowdingStyle}
          onChange={v => onChange('crowdingStyle', v)}
          options={[['bars', 'Bars'], ['dots', 'Dots'], ['heatmap', 'Heat']]}
        />
      </TweakRow>

      <TweakRow label="Accent">
        <div role="radiogroup" aria-label="Accent colour" style={{ display: 'flex', gap: 8 }}>
          {Object.entries(ACCENT_MAP).map(([k, c]) => (
            <button
              key={k}
              role="radio"
              aria-checked={tweaks.accent === k}
              aria-label={`Accent colour: ${k}`}
              onClick={() => onChange('accent', k)}
              style={{
                width: 26, height: 26, borderRadius: 100, background: c,
                outline: tweaks.accent === k ? '2px solid var(--ink)' : 'none', outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </TweakRow>
    </div>
  );
}

export { ACCENT_MAP };

function TweakRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function Segmented({ value, onChange, options, label }: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      style={{ display: 'flex', background: 'var(--bg-2)', padding: 3, borderRadius: 100, border: '1px solid var(--line)' }}
    >
      {options.map(([v, optionLabel]) => (
        <button
          key={v}
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          style={{
            flex: 1, padding: '6px 10px', borderRadius: 100,
            fontSize: 12, fontWeight: 500,
            background: value === v ? 'var(--ink)' : 'transparent',
            color: value === v ? 'var(--bg)' : 'var(--ink-2)',
            transition: 'all 0.15s',
          }}
        >{optionLabel}</button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Smoke test the focus trap manually**

Start dev server: `npm run dev`

1. Open http://localhost:3000
2. Click the tweaks FAB (gear icon, bottom right on mobile)
3. Panel opens — keyboard focus should jump inside the panel automatically
4. Press Tab repeatedly — focus should cycle through buttons without escaping the panel
5. Press Escape — panel should close and focus should return to the FAB button

- [ ] **Step 4: Commit**

```bash
git add app/_components/TweaksPanel.tsx
git commit -m "feat(a11y): TweaksPanel — dialog role, focus trap, radiogroup/radio, swatch labels"
```

---

## Task 4: Shared components — CrowdingStrip, DepartureRow, FullDepartureRow

**Files:**
- Modify: `app/_components/shared/CrowdingStrip.tsx`
- Modify: `app/_components/shared/DepartureRow.tsx`
- Modify: `app/_components/shared/FullDepartureRow.tsx`

- [ ] **Step 1: Add sr-only text summary to CrowdingStrip**

In `app/_components/shared/CrowdingStrip.tsx`, replace the opening of the default export function:

```tsx
export default function CrowdingStrip({ crowding, style = 'bars', invert = false, size = 'md' }: CrowdingStripProps) {
  const h = size === 'sm' ? 14 : 22;
  const textMuted = invert ? 'color-mix(in oklab, var(--bg), transparent 50%)' : 'var(--ink-3)';
```

Replace with:

```tsx
export default function CrowdingStrip({ crowding, style = 'bars', invert = false, size = 'md' }: CrowdingStripProps) {
  const h = size === 'sm' ? 14 : 22;
  const textMuted = invert ? 'color-mix(in oklab, var(--bg), transparent 50%)' : 'var(--ink-3)';
  const srSummary = crowding.map((c, i) =>
    `car ${i + 1} ${c < 0.4 ? 'quiet' : c < 0.75 ? 'moderate' : 'busy'}`
  ).join(', ');
```

Then, in each of the three return branches (dots, heatmap, bars), wrap the outermost `<div>` to include the sr-only span. For the **dots** branch, change:

```tsx
  if (style === 'dots') {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
```

to:

```tsx
  if (style === 'dots') {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        <span className="sr-only">Carriage occupancy: {srSummary}</span>
```

For the **heatmap** branch, change:

```tsx
  if (style === 'heatmap') {
    return (
      <div>
        <div style={{ display: 'flex', gap: 3, height: h, borderRadius: 4, overflow: 'hidden' }}>
```

to:

```tsx
  if (style === 'heatmap') {
    return (
      <div>
        <span className="sr-only">Carriage occupancy: {srSummary}</span>
        <div style={{ display: 'flex', gap: 3, height: h, borderRadius: 4, overflow: 'hidden' }}>
```

For the **bars (default)** branch, change:

```tsx
  // bars (default)
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: h }}>
```

to:

```tsx
  // bars (default)
  return (
    <div>
      <span className="sr-only">Carriage occupancy: {srSummary}</span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: h }}>
```

- [ ] **Step 2: Update DepartureRow — aria-hidden on arrow, bad-text for cancelled**

In `app/_components/shared/DepartureRow.tsx`, make two changes:

Change the cancelled chip colour from `var(--bad)` to `var(--bad-text)`:

```tsx
          {d.cancelled && <span className="chip" style={{ color: 'var(--bad-text)' }}>cancelled</span>}
```

Add `aria-hidden="true"` to the arrow icon:

```tsx
      <IconArrow aria-hidden="true" style={{ width: 14, height: 14, color: 'var(--ink-3)' }} />
```

The full updated return:

```tsx
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '14px 0', display: 'flex', gap: 14, alignItems: 'center',
      borderBottom: '1px solid var(--line-2)', textAlign: 'left',
    }}>
      <div style={{ width: 54 }}>
        <div className="serif num" style={{ fontSize: 24, lineHeight: 1, letterSpacing: '-0.02em' }}>{timeStr}</div>
        {d.delayMinutes > 0 && (
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--accent)', marginTop: 4 }}>+{d.delayMinutes}</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span className="chip">{d.trainCategory}</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>TRACK {d.actualTrack}</span>
          {d.trackChanged && <span className="chip warn">changed</span>}
          {d.cancelled && <span className="chip" style={{ color: 'var(--bad-text)' }}>cancelled</span>}
        </div>
        <div className="serif" style={{ fontSize: 17, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {d.direction}
        </div>
        {verbose && d.crowding && (
          <div style={{ marginTop: 8, maxWidth: 220 }}>
            <CrowdingStrip crowding={d.crowding} style="bars" size="sm" />
          </div>
        )}
      </div>
      <IconArrow aria-hidden="true" style={{ width: 14, height: 14, color: 'var(--ink-3)' }} />
    </button>
  );
```

- [ ] **Step 3: Update FullDepartureRow — aria-hidden on arrow, ok-text / bad-text tokens**

In `app/_components/shared/FullDepartureRow.tsx`, make three changes:

1. "on time" text: change `color: 'var(--ok)'` → `color: 'var(--ok-text)'`
2. Cancelled chip: change `color: 'var(--bad)'` → `color: 'var(--bad-text)'`
3. Arrow icon: add `aria-hidden="true"`

Full updated return statement:

```tsx
  return (
    <button onClick={onOpen} style={{
      width: '100%', padding: '16px 0', display: 'grid',
      gridTemplateColumns: '72px 1fr auto', gap: 14, alignItems: 'start',
      borderBottom: '1px solid var(--line-2)', textAlign: 'left',
    }}>
      <div>
        <div className="serif num" style={{
          fontSize: 28, lineHeight: 1, letterSpacing: '-0.02em',
          textDecoration: d.cancelled ? 'line-through' : 'none',
        }}>
          {timeStr}
        </div>
        {d.delayMinutes > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 5, alignItems: 'baseline' }}>
            <span className="mono num" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>+{d.delayMinutes}</span>
            <span className="mono num" style={{ fontSize: 10, color: 'var(--ink-3)', textDecoration: 'line-through' }}>{plannedStr}</span>
          </div>
        )}
        {d.delayMinutes === 0 && !d.cancelled && (
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ok-text)', marginTop: 5 }}>on time</div>
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
          <span className="chip">{d.trainCategory}</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>TRACK {d.actualTrack}</span>
          {d.trackChanged && <span className="chip warn">track changed</span>}
          {d.cancelled && (
            <span className="chip" style={{ color: 'var(--bad-text)', background: 'color-mix(in oklab, var(--bad) 14%, transparent)' }}>cancelled</span>
          )}
        </div>
        <div className="serif" style={{ fontSize: 19, lineHeight: 1.2 }}>{d.direction}</div>
        {verbose && !d.cancelled && d.crowding && (
          <div style={{ marginTop: 10, maxWidth: 240 }}>
            <CrowdingStrip crowding={d.crowding} style={crowdingStyle} size="sm" />
          </div>
        )}
      </div>

      <IconArrow aria-hidden="true" style={{ width: 14, height: 14, color: 'var(--ink-3)', marginTop: 10 }} />
    </button>
  );
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/_components/shared/CrowdingStrip.tsx app/_components/shared/DepartureRow.tsx app/_components/shared/FullDepartureRow.tsx
git commit -m "feat(a11y): CrowdingStrip sr-only summary, arrow aria-hidden, ok/bad-text tokens in rows"
```

---

## Task 5: RhythmView — headings, live regions, aria-hidden

**Files:**
- Modify: `app/_components/views/RhythmView.tsx`

- [ ] **Step 1: Change "Good morning." div to h1**

Find:
```tsx
          <div className="serif" style={{ fontSize: 34, lineHeight: 1, letterSpacing: '-0.02em' }}>
            Good morning.
          </div>
```

Replace with:
```tsx
          <h1 className="serif" style={{ fontSize: 34, lineHeight: 1, letterSpacing: '-0.02em' }}>
            Good morning.
          </h1>
```

- [ ] **Step 2: Change "Your commute" eyebrow to h2**

Find:
```tsx
              <div className="eyebrow">Your commute</div>
```

Replace with:
```tsx
              <h2 className="eyebrow">Your commute</h2>
```

- [ ] **Step 3: Add departures live region in RhythmView's main return**

Add a visually-hidden live region just before the `<div className="rhythm-grid">` line:

```tsx
      {/* Departures live region — announces count to screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {departures ? `${departures.length} departures loaded` : ''}
      </div>

      {/* ── Desktop 2-column grid ─────────────────── */}
      <div className="rhythm-grid">
```

- [ ] **Step 4: Add delay live region inside YourTrainCard**

In the `YourTrainCard` function, add a live region wrapping the delay status. Find the delay/on-time display in the "Big time" section:

```tsx
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div className="mono num" style={{
            fontSize: 13, fontWeight: 600,
            color: late > 0 ? 'var(--accent)' : 'color-mix(in oklab, var(--bg), transparent 30%)',
          }}>
            {late > 0 ? `+${late}` : 'on time'}
          </div>
```

Replace with:

```tsx
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            aria-live="polite"
            aria-atomic="true"
            aria-label="Train status"
            className="mono num"
            style={{
              fontSize: 13, fontWeight: 600,
              color: late > 0 ? 'var(--accent)' : 'color-mix(in oklab, var(--bg), transparent 30%)',
            }}
          >
            {late > 0 ? `+${late}` : 'on time'}
          </div>
```

- [ ] **Step 5: Add aria-hidden to the IconArrow in AnomalyBlock**

In the `AnomalyBlock` function, find:
```tsx
            <IconArrow style={{ width: 16, height: 16 }} />
```

Replace with:
```tsx
            <IconArrow aria-hidden="true" style={{ width: 16, height: 16 }} />
```

- [ ] **Step 6: Change "Your baseline" and "Later today" eyebrows to h2**

In `BaselineBlock`, find:
```tsx
      <div className="eyebrow" style={{ marginBottom: 10 }}>Your baseline · last 12 weeks</div>
```
Replace with:
```tsx
      <h2 className="eyebrow" style={{ marginBottom: 10 }}>Your baseline · last 12 weeks</h2>
```

In `LaterToday`, find:
```tsx
        <div className="eyebrow">Later today · from ASD</div>
```
Replace with:
```tsx
        <h2 className="eyebrow">Later today · from ASD</h2>
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add app/_components/views/RhythmView.tsx
git commit -m "feat(a11y): RhythmView — h1/h2 headings, departures + delay live regions, aria-hidden arrow"
```

---

## Task 6: StationView — heading, live region, search label, icon aria-hidden

**Files:**
- Modify: `app/_components/views/StationView.tsx`

- [ ] **Step 1: Change station name div to h1**

In `StationView`, find:
```tsx
        <div className="serif" style={{ fontSize: 40, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {station.name}
        </div>
```

Replace with:
```tsx
        <h1 className="serif" style={{ fontSize: 40, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {station.name}
        </h1>
```

- [ ] **Step 2: Add departures live region in StationView**

Just before the `<div style={{ padding: '0 20px' }}>` that renders the departure rows, add:

```tsx
      {/* Departures live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {departures ? `${departures.length} departures loaded` : ''}
      </div>

      <div style={{ padding: '0 20px' }}>
```

- [ ] **Step 3: Add aria-hidden to back icon in StationView**

Find:
```tsx
        <button onClick={onBack} style={{ padding: '6px 0', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconBack style={{ width: 18, height: 18 }} />
          <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Back</span>
        </button>
```

Replace with:
```tsx
        <button onClick={onBack} style={{ padding: '6px 0', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconBack aria-hidden="true" style={{ width: 18, height: 18 }} />
          <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Back</span>
        </button>
```

- [ ] **Step 4: Add search label, input id, aria-hidden on icons in StationSearch**

In `StationSearch`, find the back button:
```tsx
        <button onClick={onBack} style={{ padding: '6px 0', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconBack style={{ width: 18, height: 18 }} />
          <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Back</span>
        </button>
```

Replace with:
```tsx
        <button onClick={onBack} style={{ padding: '6px 0', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconBack aria-hidden="true" style={{ width: 18, height: 18 }} />
          <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Back</span>
        </button>
```

Find the search input area:
```tsx
          <IconSearch style={{ width: 18, height: 18, color: 'var(--ink-3)' }} />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Amsterdam, Utrecht, ASD…"
            style={{
              flex: 1, background: 'transparent', border: 0, outline: 'none',
              fontSize: 16, color: 'var(--ink)', fontFamily: 'inherit',
            }}
          />
          {q && (
            <button onClick={() => setQ('')} style={{ color: 'var(--ink-3)' }}>
              <IconClose style={{ width: 16, height: 16 }} />
            </button>
          )}
```

Replace with:
```tsx
          <IconSearch aria-hidden="true" style={{ width: 18, height: 18, color: 'var(--ink-3)' }} />
          <label htmlFor="station-search" className="sr-only">Search stations</label>
          <input
            id="station-search"
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Amsterdam, Utrecht, ASD…"
            style={{
              flex: 1, background: 'transparent', border: 0, outline: 'none',
              fontSize: 16, color: 'var(--ink)', fontFamily: 'inherit',
            }}
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear search" style={{ color: 'var(--ink-3)' }}>
              <IconClose aria-hidden="true" style={{ width: 16, height: 16 }} />
            </button>
          )}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/_components/views/StationView.tsx
git commit -m "feat(a11y): StationView — h1, live region, search label, icon aria-hidden"
```

---

## Task 7: JourneyView — headings, sparkline, platform diagram, delay token

**Files:**
- Modify: `app/_components/views/JourneyView.tsx`

- [ ] **Step 1: Change route headline div to h1**

Find:
```tsx
        <div className="serif" style={{ fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          <em style={{ fontStyle: 'italic' }}>{stops[0].name}</em>
          <span style={{ color: 'var(--ink-3)' }}> → </span>
          <em style={{ fontStyle: 'italic' }}>{train.direction}</em>
        </div>
```

Replace with:
```tsx
        <h1 className="serif" style={{ fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          <em style={{ fontStyle: 'italic' }}>{stops[0].name}</em>
          <span style={{ color: 'var(--ink-3)' }}> → </span>
          <em style={{ fontStyle: 'italic' }}>{train.direction}</em>
        </h1>
```

- [ ] **Step 2: Change delay status from --ok / --accent to --ok-text**

Find (the "on time" / "+N min" display):
```tsx
          <div className="mono" style={{ fontSize: 12, color: train.delayMinutes > 0 ? 'var(--accent)' : 'var(--ok)' }}>
            {train.delayMinutes > 0 ? `+${train.delayMinutes} min` : 'on time'}
          </div>
```

Replace with:
```tsx
          <div className="mono" style={{ fontSize: 12, color: train.delayMinutes > 0 ? 'var(--accent)' : 'var(--ok-text)' }}>
            {train.delayMinutes > 0 ? `+${train.delayMinutes} min` : 'on time'}
          </div>
```

- [ ] **Step 3: Change "Platform choreography" eyebrow to h2**

Find:
```tsx
        <div className="eyebrow" style={{ marginBottom: 10 }}>Platform choreography</div>
```

Replace with:
```tsx
        <h2 className="eyebrow" style={{ marginBottom: 10 }}>Platform choreography</h2>
```

- [ ] **Step 4: Add aria-hidden to PlatformDiagram (prose above it is the text alternative)**

Find:
```tsx
          <div style={{ marginTop: 16 }}>
            <PlatformDiagram
              crowding={crowding}
              highlight={quietest}
              quietCar={train.quietCarriage ?? null}
              firstClass={train.firstClassCars ?? []}
            />
          </div>
```

Replace with:
```tsx
          <div aria-hidden="true" style={{ marginTop: 16 }}>
            <PlatformDiagram
              crowding={crowding}
              highlight={quietest}
              quietCar={train.quietCarriage ?? null}
              firstClass={train.firstClassCars ?? []}
            />
          </div>
```

- [ ] **Step 5: Change "Why you're late" eyebrow to h2**

Find:
```tsx
          <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--accent)' }}>⁕ Why you&apos;re late</div>
```

Replace with:
```tsx
          <h2 className="eyebrow" style={{ marginBottom: 10, color: 'var(--accent)' }}>⁕ Why you&apos;re late</h2>
```

- [ ] **Step 6: Add role="img" and aria-label to the Spark SVG**

The `Spark` function is defined at the bottom of the file. Replace it entirely:

```tsx
function Spark() {
  const points = [6, 7, 8, 6, 5, 5, 4, 4, 3, 3, 2, 2, 2];
  const max = Math.max(...points);
  const first = points[0];
  const last = points[points.length - 1];
  const trend = last < first ? 'improving' : last > first ? 'worsening' : 'stable';
  return (
    <svg
      width="160" height="24" viewBox="0 0 160 24" fill="none"
      role="img"
      aria-label={`Delay trend: ${trend} over the last 30 minutes`}
    >
      <polyline
        points={points.map((v, i) => `${(i / (points.length - 1)) * 160},${24 - (v / max) * 20 - 2}`).join(' ')}
        fill="none" stroke="var(--accent)" strokeWidth="1.4" strokeLinejoin="round"
      />
    </svg>
  );
}
```

- [ ] **Step 7: Change "Journey timeline" eyebrow to h2 and add aria-hidden to back icon**

Find:
```tsx
        <div className="eyebrow" style={{ marginBottom: 12 }}>Journey timeline · {stops.length} stops</div>
```

Replace with:
```tsx
        <h2 className="eyebrow" style={{ marginBottom: 12 }}>Journey timeline · {stops.length} stops</h2>
```

Find the back button:
```tsx
        <button onClick={onBack} style={{ padding: '6px 0', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconBack style={{ width: 18, height: 18 }} />
          <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Back</span>
        </button>
```

Replace with:
```tsx
        <button onClick={onBack} style={{ padding: '6px 0', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconBack aria-hidden="true" style={{ width: 18, height: 18 }} />
          <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Back</span>
        </button>
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add app/_components/views/JourneyView.tsx
git commit -m "feat(a11y): JourneyView — h1/h2 headings, sparkline role, platform diagram aria-hidden, ok-text token"
```

---

## Task 8: PulseView — headings, reduced-motion guard, impact tokens

**Files:**
- Modify: `app/_components/views/PulseView.tsx`

- [ ] **Step 1: Change "Pulse." masthead div to h1**

Find:
```tsx
          <div className="serif" style={{ fontSize: 34, lineHeight: 1, letterSpacing: '-0.02em' }}>
            Pulse<em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>.</em>
          </div>
```

Replace with:
```tsx
          <h1 className="serif" style={{ fontSize: 34, lineHeight: 1, letterSpacing: '-0.02em' }}>
            Pulse<em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>.</em>
          </h1>
```

- [ ] **Step 2: Add reduced-motion guard at the top of the rAF useEffect**

Find the animation useEffect:
```tsx
  // Advance trains via rAF
  useEffect(() => {
    lastTsRef.current = performance.now();
    const loop = (ts: number) => {
```

Replace with:
```tsx
  // Advance trains via rAF
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Skip animation — trains stay at their initial positions
      return;
    }
    lastTsRef.current = performance.now();
    const loop = (ts: number) => {
```

- [ ] **Step 3: Change "Today's weather" eyebrow to h2**

Find:
```tsx
        <div className="eyebrow" style={{ marginBottom: 10 }}>Today&apos;s weather</div>
```

Replace with:
```tsx
        <h2 className="eyebrow" style={{ marginBottom: 10 }}>Today&apos;s weather</h2>
```

- [ ] **Step 4: Update disruption impact text tokens (small text using --ok / --warn)**

Find the impact text colour expression in the disruption list:
```tsx
                  color: d.severity > 0.5 ? 'var(--accent)' : d.severity > 0 ? 'var(--warn)' : 'var(--ok)',
```

Replace with:
```tsx
                  color: d.severity > 0.5 ? 'var(--accent)' : d.severity > 0 ? 'var(--warn-text)' : 'var(--ok-text)',
```

- [ ] **Step 5: Add aria-label and aria-hidden to the close button in the selected train card**

Find:
```tsx
              <button onClick={() => setSelected(null)} style={{ padding: 4, color: 'var(--ink-3)' }}>
                <IconClose style={{ width: 18, height: 18 }} />
              </button>
```

Replace with:
```tsx
              <button onClick={() => setSelected(null)} aria-label="Close train card" style={{ padding: 4, color: 'var(--ink-3)' }}>
                <IconClose aria-hidden="true" style={{ width: 18, height: 18 }} />
              </button>
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Run a production build to confirm no issues**

```bash
npm run build
```

Expected: successful build, no TypeScript or lint errors.

- [ ] **Step 8: Commit**

```bash
git add app/_components/views/PulseView.tsx
git commit -m "feat(a11y): PulseView — h1/h2 headings, reduced-motion guard, ok/warn-text tokens, close button label"
```

---

## Verification Checklist

After all tasks are complete, confirm:

- [ ] `npm run build` is clean
- [ ] `npx tsc --noEmit` is clean
- [ ] In browser with VoiceOver/NVDA: tabbing through the page announces headings correctly
- [ ] Focus ring (accent outline) visible on all interactive elements when using keyboard
- [ ] TweaksPanel: opens with focus inside, Tab cycles within, Escape closes, focus returns to FAB
- [ ] `prefers-reduced-motion: reduce` in browser OS settings stops train animation and fade-up animations
- [ ] Screen reader announces departure count when RhythmView/StationView loads data
- [ ] Colour contrast: `--ink-3` text on `--bg` passes at ≥ 4.5:1 (verify with browser DevTools or webaim.org/resources/contrastchecker using `oklch(0.42 0.01 60)` on `oklch(0.975 0.012 85)`)
