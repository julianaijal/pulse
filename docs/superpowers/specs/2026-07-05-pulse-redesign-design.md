# Pulse Visual Redesign — Design Spec

**Date**: 2026-07-05
**Status**: Draft
**Scope**: Presentation-only overhaul — all existing features, state management, data flows, and accessibility patterns are preserved.

## Overview

Replace the editorial serif aesthetic (Instrument Serif, OKLCH tokens, dark mode, multi-accent) with a transit-app look: Plus Jakarta Sans, hex transit-blue palette, white card UI on light gray, rounded geometric shapes. Drop dark mode and accent-switching entirely.

Design reference: `/Users/aijal000/Downloads/design_handoff_pulse_redesign/` (README, screenshots 1a–1e, map-geometry.txt).

## Approach

**Token-first, view-by-view** — replace the foundation (fonts, tokens), then update each view against the reference screenshots, then shared components.

## 1. Foundation

### Font swap

**Remove**: Instrument Serif, JetBrains Mono, Inter.
**Add**: Plus Jakarta Sans (Google Fonts, weights 400–800).

In `layout.tsx`:
- Replace font `<link>` tags with Plus Jakarta Sans
- Remove the theme/accent initialization `<script>` block (no more dark mode or accent switching)
- Update `<meta name="theme-color">` to `#F2F4F8`
- Keep `lang="nl"`, viewport settings, preconnects

### Design tokens (globals.css)

Replace the entire OKLCH color block and dark-mode `[data-theme="dark"]` selector with:

```
--bg:            #F2F4F8
--card:          #FFFFFF
--line:          #E3E8F0
--line-row:      #EEF1F6
--subtle:        #F7F9FC

--ink:           #0B1526
--ink-2:         #3D4C63
--ink-3:         #5A6B82
--ink-4:         #8FA3BE
--ink-cancel:    #B7C2D2

--primary:       #0A5CE8
--primary-tint:  #EAF1FE
--primary-deep:  #0A2C66
--primary-muted: #9DB6E3

--ok:            #0E9F5B
--ok-light:      #2FCB82
--ok-tint:       #D9F3E6
--ok-ring:       #7FE0AE

--warn:          #FFB300
--warn-accent:   #E88A00
--warn-text:     #B26A00
--warn-dark:     #3A2A00
--warn-tint:     #FFF6E5
--warn-border:   #F5DBA6

--bad:           #DF3B4B
--bad-tint:      #FDECEE
--bad-border:    #F3D4D8

--map-land:      #EEF3FA
--map-stroke:    #D4DEEC
--map-route:     #C3D2E8
```

**Remove**: `--bg-2`, `--bg-3`, `--accent`, `--accent-dim`, all `--*-on-ink` variants, all `[data-theme="dark"]` rules, accent-switching CSS.

### Updated globals

- `--radius`: 16px (was 14px)
- `--radius-lg`: 22px (unchanged)
- `--sidebar-w`: 240px (was 220px)
- Font family on `body`: `'Plus Jakarta Sans', sans-serif`
- `font-variant-numeric: tabular-nums` on `.num` class (keep)
- `.eyebrow`: Plus Jakarta Sans, 10–10.5px, w700, uppercase, letter-spacing 0.08–0.1em (was mono)
- `.serif`, `.mono` classes: delete
- `.card`: white bg, 1px `--line` border, radius 16px, no shadow
- `.skeleton`: `#EEF1F6` bg
- `.dot` pulse: 2s cycle, opacity 1→0.35→1 (was 1.6s expanding ring)
- Remove all accent-switching logic from `TweaksPanel.tsx` (the commute station pickers remain)

### Dark mode removal

- Delete `[data-theme="dark"]` block in globals.css
- Remove theme toggle from TweaksPanel
- Remove theme initialization script from layout.tsx
- Remove `pulse.theme` and `pulse.accent` localStorage reads

## 2. Desktop Sidebar

File: `page.tsx` (sidebar is rendered in the main shell).

Current: 220px sidebar with plain text nav.
New: 240px white sidebar, right border `--line`.

### Logo block (top)
- 34px blue (`--primary`) rounded-10px square
- White pulse-waveform stroke inside: `M2 10h3l2-5 3 10 2.5-7 1.5 2h4`
- Right of square: "Pulse" w800 16px, "Dutch rail companion" 10.5px `--ink-3`

### Nav list
- Items: Home, Network, Journeys, Stations (existing 4 tabs)
- Active: `--primary` filled pill bg, white text w700, radius 999
- Inactive: `--ink-2` text w600
- 18px stroke icons left of label (reuse/update Icons.tsx)
- Vertical gap ~4px between items

### Commute card (bottom, above spacer)
- `#F7F9FC` bg, radius 12
- Eyebrow "MY COMMUTE"
- Route: "Amsterdam C → Utrecht C" with blue arrow
- Caption: "27 min avg · 89% on time" in `--ink-3`
- Tap opens commute settings (existing StationPicker flow)

## 3. RhythmView

Files: `app/_components/views/RhythmView.tsx`

### Mobile layout (< 441px)

**Header**: Date 12px `--ink-3` over greeting 23px w800 `--ink`, left. Clock pill right (NowPill component).

**Commute chip** (new element): White pill, `--line` border, radius 999. "Amsterdam C → Utrecht C" + chevron. Tap opens commute settings.

**Hero card**: `--primary-deep` bg, radius 20, white text.
- Eyebrow "YOUR NEXT TRAIN" + "IC 3127" chip (white 12% alpha bg, radius 999)
- Time: 62px w800, tabular-nums, letter-spacing −0.03em
- Delay: amber chip `--warn` bg, "+4 min" white text. Below: struck "plan 08:14" in `--primary-muted`
- Destination: 17px w700
- Caption: "leaves in N min · walk by HH:MM" 12px `--primary-muted`
- Track box: 40px square, 2px white 35% border, radius 10, number 19px w800, "TRACK" 9px below
- Divider: 1px white 14% opacity
- Crowding strip: 6 segments, 19px tall, radius 6, gap 4px. Quiet = white 28–45% alpha. Busy = solid `#FFB300`. Recommended = solid `#2FCB82` + 2px `#7FE0AE` outline
- Header: "CROWDING · BOARD CAR N" eyebrow left, recommendation text right (green if quietest)

**Smart swap banner**: `--warn-tint` bg, radius 15, padding 14px. Left: 32px amber icon tile (swap arrows, `--warn` bg, white icon, radius 10). Center: message w600 12px ("The **08:22 Sprinter** beats your delayed train and is emptier."). Right: "Swap" blue text w700.

**Later today**: Eyebrow "LATER TODAY" left, "See all" blue link right. White card, radius 16, 5 departure rows (DepartureRow).

### Desktop layout (≥ 768px)

**Top bar**: Date/greeting left (26px w800 greeting). Right: clock pill + 36px navy avatar circle.

**Hero row**: CSS grid `1fr 360px`, gap 20px.
- Left: hero card (same as mobile but 74px time, 46px track box radius 12, 22px crowding segments)
- Right: **Network now** card — eyebrow "NETWORK NOW" + "2 disruptions" amber count. Mini SVG map (cropped viewBox of the full network map, showing routes + train dots + dashed disruption circle). Two disruption rows below map (amber tint row + neutral row, radius 10: dot, label w600, impact w800 right)

**Bottom row**: Same grid.
- Left: **Later today** card with departure rows (17px time, category badge, destination, status, track badge). Cancelled row: struck gray time, red badge tint, "cancelled" red.
- Right column, stacked:
  - **Baseline** card: eyebrow "YOUR BASELINE · 12 WEEKS". 3 tiles on `#F7F9FC`, radius 12: 24px number + unit suffix, caption below. Stats: on-time %, avg ride duration, avg crowd %.
  - **Smart swap** card: `--warn-tint` bg, radius 14. Eyebrow "SMART SWAP". Message text. Dark `--ink` CTA button, radius 10, "Swap to the 08:22 →".

## 4. Shared Components

### DepartureRow (`app/_components/shared/DepartureRow.tsx`)

Row layout (flex, align-center, gap 10px, padding 11–12px vertical):
- **Time**: 15–17px w800, tabular-nums. Cancelled = struck, `--ink-cancel` color
- **Category badge**: "IC"/"SPR"/"ICD", `--primary-tint` bg, `--primary` text, w700, 10px font, radius 5–7px, padding 2px 6px
- **Destination**: w600, `--ink` color, flex-grow
- **Status text**: On-time = `--ok` w700 "on time". Delayed = `--warn-accent` w800 "+N min" (compact) or "+N min" / "delayed". Cancelled = `--bad` w800 "cancelled"
- **Track badge**: outlined, 1.5–2px `--line` border, radius 7px, min-width 28px, center-aligned, w700. Cancelled = "—"
- Row divider: 1px `--line-row`
- Hover/press: bg `--subtle`

### FullDepartureRow (`app/_components/shared/FullDepartureRow.tsx`)

Station board variant:
- **Time column** (48px): 16px w800 time top. Delay "+2 min" amber 10px below. Cancelled = struck time + no delay
- **Middle**: Destination w700 14px. Caption "IC 2853 · via Gouda" `--ink-3` 12px
- **Status + track**: Same as DepartureRow

### CrowdingStrip (`app/_components/shared/CrowdingStrip.tsx`)

Simplify to single bar style (remove dots/heatmap variants and the `style` prop):
- Segments: equal flex, gap 4px, radius 6
- On dark bg (hero): quiet = white 28–45% alpha, busy = solid `#FFB300`, recommended = solid `#2FCB82` + 2px `#7FE0AE` outline
- On light bg: quiet = `#CBD7E8`, moderate = `#8FA3BE`, busy = `#E88A00`, recommended = `#D9F3E6` bg + `#2FCB82` fill + 2px `#0E9F5B` outline
- Remove `invert` prop — detect context from a new `variant` prop: `"hero"` (dark) or `"card"` (light)

### NowPill (`app/_components/shared/NowPill.tsx`)

- White bg, 1px `--line` border, radius 999
- Green dot 6–7px, 2s opacity pulse animation
- Time text w600, `--ink` color

## 5. PulseView (Network Map)

File: `app/_components/views/PulseView.tsx`

### Mobile layout

**Header**: "Network" 23px w800 left, "N trains live" pill right (NowPill variant with train count).

**Filter chips row** (horizontal scroll): "All" = dark `--ink` bg + white text. "Intercity"/"Sprinter" = white bg + `--line` border + `--ink-2` text. "Delayed" = white bg + `--warn-border` border + `--warn-accent` text.

**Map card**: White bg, radius 20, overflow hidden, fills remaining height.
- SVG `viewBox="0 0 420 540"`
- NL coastline: path from `map-geometry.txt` NL_PATH, fill `--map-land`, stroke `--map-stroke`, stroke-width 1.5
- Route lines: from ROUTE_LINES data, stroke `--map-route`, width 2.5, round caps
- Disruption zones: dashed circles at positions from geometry file (amber 13% fill for active, gray 12% for resolved), dash pattern `4 4`
- Train dots: r4.5, 1.5px white stroke. On-time = `--primary` fill. Delayed = `--warn` fill. Positions from TRAINS data (existing animation logic drives positions in production)
- Station dots: r3.5, `--ink` fill. Major station labels: 10px w700 `--ink`
- Legend chips bottom-left: "on time" (blue dot) + "delayed" (amber dot)

**Disruption cards** (below map): White bg, radius 14. Active = 2px amber left border. Title w700 14px. Route/detail caption `--ink-3`. Impact badge right ("+4–7 min" amber text).

### Desktop layout

Map card fills left column. Disruption cards in right panel (existing side-panel pattern).

## 6. JourneyView

File: `app/_components/views/JourneyView.tsx`

**Header row** (flex, align-center):
- 34px circular back button: white bg, `--line` border, `<` icon `--ink`
- "IC 3127" badge: `--primary-tint` bg, `--primary` text, w700, radius 999
- Green "live" pulse dot (6px, 2s animation)
- Title: "to Utrecht Centraal" 19px w800, flex-grow
- Track box right: same style as hero (34px, `--line` border, radius 10)

**"Where to stand" card**: White bg, radius 16.
- Eyebrow "WHERE TO STAND" left. "Car N · X% full" right (green = <40%, amber = 40–75%, red = >75%)
- Train diagram: 6 flex cars, 34px tall, gap 3px. End cars get 8px outer corner radius. Base fill `#CBD7E8`.
  - Crowd fill as bottom-aligned inner bar: `#8FA3BE` (≤55%), `#E88A00` (≥85%)
  - Recommended car: `#D9F3E6` bg + `#2FCB82` fill bar + 2px `#0E9F5B` outline
  - Car number centered, 11px w800
- Platform zones: 4 zones (A–D), flex row, 2px top border gray. Recommended zone = green border + "Zone D · here" green text

**"Stops" card**: White bg, radius 16.
- Eyebrow "STOPS" left. "running +N min" `--warn-accent` right
- Vertical timeline, left edge:
  - Current/past stop: filled `--primary` dot (8px) + light-blue ring (14px, `--primary-tint`), solid `--primary` connector line (2px)
  - Future stop: outlined dot (8px, 2px `--line` border, white fill), gray `--line` connector (2px)
- Each stop row: station name w700 14px, time w800 right. Caption "Departure · track N" `--ink-3`. Per-stop delay "+N" `--warn-accent` far right

**Footer actions**: 2 buttons, flex row, gap 10px, full-width.
- "Set arrival alert": `--primary` bg, white text, w700, radius 13, padding 14px
- "Share ETA": white bg, `--line` border, `--ink` text, w700, radius 13

## 7. StationView

File: `app/_components/views/StationView.tsx`

**Title**: "Stations" 23px w800.

**Search field**: White bg, radius 14, padding 12px 16px. Search icon `--ink-4` left. Input w600 14px, placeholder `--ink-4`. "Cancel" text button right (blue `--primary`), appears when input is focused/non-empty.

**Autocomplete chips** (horizontal): Active = `--primary-tint` bg, `--primary` text w700. Inactive = `--subtle` bg, `--ink-2` text w600. Radius 999. Format: "CODE · Station Name".

**Station header**: Station name 19px w800. Caption "N tracks · updated HH:MM" `--ink-3`. "live board" pill right (green dot + text).

**Board card**: White bg, radius 16. Rows use FullDepartureRow. 1px `--line-row` dividers between rows.

## 8. TabBar

File: `app/_components/TabBar.tsx`

- White bg at 92% opacity + `backdrop-filter: blur(12px)`
- Top border: 1px `--line`
- 4 equal columns (flex), center-aligned
- Icons: 21px, stroke style
- Labels: 9.5px w600
- Active tab: `--primary` color w800 text, icon gets 12%-alpha `--primary` filled circle behind it
- Inactive: `#8FA3BE` color
- Bottom padding: 24px (home indicator clearance)
- `env(safe-area-inset-bottom)` for notch devices

## 9. Icons

File: `app/_components/icons/Icons.tsx`

Update `baseProps.strokeWidth` from 1.6 to 1.7.

**New icon**: Logo mark — blue rounded square with white waveform stroke. Used in sidebar logo block.

Existing icons (IconRhythm, IconPulse, IconJourney, IconSearch, IconArrow, IconBack, IconTrain, etc.) keep the same component API. Update individual paths only where the design shows noticeably different icon shapes. The 4 tab icons (Home, Network/Radar, Journey/Route, Search/Stations) should match the screenshots.

**New icon**: Swap arrows icon for the smart swap banner (two curved arrows).

## 10. Map Geometry Data

The `map-geometry.txt` file contains precomputed SVG coordinates for a 420×540 viewBox. This data should be embedded in the PulseView component (or imported as a constant) to replace the current live `project()` calculation for the map layout. Station coordinates, the NL outline path, route line segments, and initial train positions are all provided.

## Files Changed

| File | Change |
|------|--------|
| `app/globals.css` | Replace all tokens, remove dark mode, update utility classes |
| `app/layout.tsx` | Font swap, remove theme script, update meta |
| `app/page.tsx` | Sidebar redesign (logo, nav pills, commute card) |
| `app/_components/views/RhythmView.tsx` | Full restyle (hero, grid layout, smart swap, baseline, later today) |
| `app/_components/views/PulseView.tsx` | Map card restyle, filter chips, disruption cards, geometry data |
| `app/_components/views/JourneyView.tsx` | Header, where-to-stand, stops timeline, footer buttons |
| `app/_components/views/StationView.tsx` | Search field, chips, station header, board card |
| `app/_components/TabBar.tsx` | Blur bar, new active state, padding |
| `app/_components/shared/DepartureRow.tsx` | New row anatomy (category badge, track badge, status text) |
| `app/_components/shared/FullDepartureRow.tsx` | Station board variant with delay under time |
| `app/_components/shared/CrowdingStrip.tsx` | Simplify to single bar style, new color scheme |
| `app/_components/shared/NowPill.tsx` | White pill with green dot |
| `app/_components/icons/Icons.tsx` | Stroke width update, new logo + swap icons |
| `app/_components/TweaksPanel.tsx` | Remove dark mode toggle + accent picker, keep station pickers |

## Out of Scope

- No new state, hooks, or data flows
- No changes to API routes or mock.ts (except potentially adding map geometry constants)
- No changes to interfaces.tsx
- No new dependencies beyond the font
- No dark mode or accent switching
