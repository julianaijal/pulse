# A11y & UX Fixes — Design

**Linear:** PRO-18 — "A11y & UX-fixes: pinch-zoom, theme-flash, navigatie"
**Date:** 2026-06-12

## Problem

Six small a11y/UX defects, found in the app review of 2026-06-12:

1. `maximumScale: 1` in the viewport config blocks pinch-zoom (WCAG 1.4.4) — `app/layout.tsx:22`.
2. The theme is applied after hydration (`page.tsx` effect), so dark-mode users get a light flash on every load.
3. The Journey nav item silently redirects to Rhythm when no journey is active — in `page.tsx:84` (sidebar) *and* `TabBar.tsx:34` (mobile).
4. StationView always highlights "Pulse" in the nav (`activeNav`, `page.tsx:89`), even when the station was opened from Rhythm or Search; "Back" always goes to Pulse.
5. Half-finished ARIA tabs pattern: `role="tablist"`/`role="tab"` with `aria-controls={"panel-" + id}` pointing at IDs that don't exist; `<main>` has `role="tabpanel"` + `aria-labelledby`.
6. `crowdingColor`'s invert branch hardcodes three oklch values outside the token system — `CrowdingStrip.tsx:14-16`.

## Decisions

### 1. Pinch-zoom

Remove `maximumScale: 1` from the `viewport` export in `app/layout.tsx`. No other change.

### 2. Theme-flash: inline head script

A small inline `<script>` in `layout.tsx`'s `<head>` (before the stylesheet links) reads `localStorage` and applies the theme before first paint:

- `pulse.theme` → `document.documentElement.dataset.theme`
- `pulse.accent` → `document.documentElement.style.setProperty('--accent', …)`. The inline script cannot import `TweaksPanel.ACCENT_MAP`, so it duplicates the four oklch values; a comment on both sides marks them as mirrors.
- Wrapped in `try/catch` (private mode / disabled storage).

The existing `page.tsx` effect stays as the source of truth after hydration; setting the same values twice is harmless.

Rejected alternatives: cookie + SSR (makes the page dynamic for the same result); masking the flash by hiding the body (replaces the wrong color with a blank flash).

### 3. Journey empty state

The Journey nav item always navigates to the journey tab:

- `page.tsx` `goTo`: remove the `journey ? 'journey' : 'rhythm'` redirect.
- `TabBar.tsx:34`: remove the same redirect; drop the now-unused `hasJourney` prop (and stop passing it from `page.tsx`).
- `JourneyView` with `train === null` renders an empty state instead of `null`: the standard view header plus a muted message "Geen actieve reis — kies een trein in Rhythm of Zoeken." with two text buttons that navigate to those tabs. JourneyView gains an `onNavigate: (tab: 'rhythm' | 'search') => void` prop; `page.tsx` passes `goTo`.

### 4. Station origin

`page.tsx` station state becomes `{ station: StationObj; origin: Tab } | null`:

- `openStation(s)` records the active tab at call time as `origin`. When the station is opened from within StationView-under-search flow or the search results, origin is `'search'`; from PulseView, `'pulse'`; from RhythmView, `'rhythm'`.
- Nav highlighting: `activeNav = tab === 'station' ? origin : tab` (origin's nav identity; `'station'` never appears in the nav).
- StationView's `onBack` navigates to `origin` instead of hardcoded `'pulse'`.

### 5. Simplify nav ARIA

These are views/pages, not tabs within a document, so use plain navigation semantics:

- `TabBar.tsx`: drop `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `id`, roving `tabIndex`, and the ArrowLeft/ArrowRight key handler. Buttons keep `data-active` for styling and gain `aria-current={active ? 'page' : undefined}`.
- Sidebar items in `page.tsx`: add the same `aria-current`.
- `<main>`: drop `role="tabpanel"` and `aria-labelledby`; keep `id="main-content"` and `tabIndex={-1}` for SkipNav.
- The `.tabbar [role="tablist"]` CSS selector in `globals.css` changes to a class (`.tabbar-list`) on the wrapper div.

### 6. crowdingColor tokens

Add to `globals.css` (same values in both themes, since they sit on the always-dark `--ink` card):

```css
--ok-on-ink:   oklch(0.78 0.09 150);
--warn-on-ink: oklch(0.78 0.14 75);
--bad-on-ink:  oklch(0.72 0.18 30);
```

`crowdingColor`'s invert branch returns `var(--ok-on-ink)` etc. instead of hardcoded values.

## Out of scope

- Language of new copy follows the existing mixed state for now; app-wide NL is PRO-14. The empty-state message is written in Dutch already since it's new copy.
- Design tokens for typography/spacing (PRO-16), data honesty (PRO-15), perf (PRO-17).

## Testing

No route-handler changes; the testing foundation covers pure logic only, so no new automated tests. Gate: `npm run lint && npm test && npm run build`.

Manual smoke:
- Mobile viewport: pinch-zoom works.
- Dark theme + reload: no light flash.
- Journey tab without an active journey: empty state with working Rhythm/Zoeken links.
- Open a station from Search and from Pulse: nav highlights the origin tab; Back returns there.
- Screen reader / DOM check: no `tablist`/`tabpanel` roles; `aria-current="page"` on the active nav item.

## Delivery

- Branch `julianaijal/pro-18-a11y-ux-fixes`; PRO-18 → In Progress at start, In Review when the PR opens.
- Atomic commits per fix, each with `PRO-18` in the body; PR body contains `Fixes PRO-18`.
- Gate: `npm run lint && npm test && npm run build` locally; CI enforces the same.
