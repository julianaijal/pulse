# Schematic Rail Map — Design Spec

## Summary

Replace the current geographic SVG map in PulseView with a schematic metro-style diagram showing all 397 Dutch railway stations. The map uses hand-positioned anchor nodes for ~20 major interchanges, auto-interpolated positions for intermediate stations, and semantic zoom (level-of-detail) to keep the mobile UI readable.

## Motivation

The current PulseView renders 14 stations on a geographic projection of the Netherlands. This feels limited and doesn't leverage the "living network" potential of the view. A schematic map — styled like classic metro/rail diagrams (London Underground, Berlin S-Bahn) — is more readable on small screens, more visually distinctive, and shows the full network.

## Data Sources

### Stations (NS API)

`GET /reisinformatie-api/api/v2/stations` returns all 397 NL stations with:
- `code`, `namen.lang`, `lat`, `lng`, `stationType`, `sporen[]`

Station types and their visual role:

| Type | Count | Visual |
|------|-------|--------|
| `MEGA_STATION` | 6 | Large interchange circle (r=6), always visible |
| `KNOOPPUNT_INTERCITY_STATION` | 40 | Medium interchange circle (r=4), visible from zoom 2 |
| `INTERCITY_STATION` | 13 | Tick on line, visible from zoom 2 |
| `KNOOPPUNT_SNELTREIN_STATION` | 5 | Small interchange circle (r=3), visible from zoom 3 |
| `SNELTREIN_STATION` | 6 | Tick on line, visible from zoom 3 |
| `KNOOPPUNT_STOPTREIN_STATION` | 46 | Small interchange circle (r=3), visible from zoom 3 |
| `STOPTREIN_STATION` | 279 | Smallest tick, visible from zoom 4 |
| `FACULTATIEF_STATION` | 2 | Same as stoptrein |

### Corridors (manual definition)

The NS API does not provide line/route data. We define ~30 corridors manually in a static data file, grouping them into ~10 line families with shared colors.

Example corridor definition:

```ts
{
  id: 'ic-amsterdam-rotterdam',
  family: 'ic-south',
  color: '#E8432E',
  category: 'IC',
  stations: ['ASD', 'SHL', 'LEDN', 'GVC', 'DT', 'RTD'],
}
```

### Schematic Anchor Positions (manual definition)

Hand-positioned x,y coordinates for ~20 major interchanges on a schematic grid. All other stations are interpolated along their corridor segments.

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `app/_data/corridors.ts` | ~30 corridor definitions with station order, line family, color |
| `app/_data/schematic-anchors.ts` | Hand-positioned x,y for ~20 major nodes on a grid |
| `app/_utils/schematic.ts` | Layout engine: interpolates intermediate stations, resolves multi-line intersections |
| `app/_hooks/useStations.ts` | Fetches all 397 stations from NS API, caches in localStorage |

### Modified Files

| File | Change |
|------|--------|
| `app/_components/views/PulseView.tsx` | Replace geographic SVG with schematic SVG + zoom/pan |
| `app/api/stations/route.ts` | Support no-query call to return all stations |
| `app/interfaces/interfaces.ts` | Add corridor/line types |
| `app/globals.css` | Add line-color CSS variables |

### Layout Engine (`schematic.ts`)

1. Load anchor positions for ~20 major nodes
2. For each corridor, place anchor stations at their defined positions
3. For intermediate stations between two anchors: distribute evenly along the straight line segment
4. Resolve conflicts: stations on multiple corridors get the position from their highest-priority corridor
5. Output: `Map<stationCode, { x: number, y: number }>` for all 397 stations

### Rendering (SVG with virtualization)

- SVG with a large viewBox (e.g. 1000x1400) representing the full schematic
- `viewBox` is dynamically adjusted based on zoom level and pan offset
- Only stations and routes within the visible viewport are rendered as DOM elements
- Zoom via pinch gesture (touch) and scroll wheel (desktop)
- Pan via drag (touch and mouse)

### Zoom Levels (Level-of-Detail)

| Level | Trigger | Visible stations | Labels |
|-------|---------|-----------------|--------|
| 1 (default) | Initial load | 6 mega stations | All 6 labeled |
| 2 | 1.5x zoom | + 53 knooppunt IC + IC stations | Knooppunt labeled |
| 3 | 3x zoom | + 51 knooppunt stoptrein + sneltrein | Knooppunt labeled |
| 4 | 6x zoom | All 397 stations | All labeled |

### Line Colors

Corridors grouped into ~10 line families, each with a distinct color. IC lines use full-saturation colors, Sprinter lines on the same corridor use a lighter tint or thinner stroke.

Proposed palette (10 families):

```
IC South (ASD-RTD):        #E8432E (red)
IC East (ASD-AMF-DV-AH):   #0A5CE8 (blue)
IC North (ASD-ZL-GN):      #2EAF5B (green)
IC Brabant (UT-EHV):        #F5A623 (orange)
IC Limburg (EHV-MT):        #8B5CF6 (purple)
IC Coast (GVC-LEDN-HLM):   #06B6D4 (cyan)
IC Oost-NL (ZL-ES):         #EC4899 (pink)
IC Zeeland (RTD-VS):        #78716C (stone)
IC Friesland (ZL-LW):       #D97706 (amber)
IC Direct (ASD-RTD-BD):     #FACC15 (yellow)
```

Sprinter lines: same hue at 40% opacity or 1px stroke (vs 3px for IC).

### Interactions

All existing interactions are preserved:
- **Tap station** → `onOpenStation()` → StationView
- **Tap train** → select train → detail card with "View journey"
- **Filter chips** → All / IC / Sprinter / Delayed (unchanged)
- **Disruptions panel** → desktop side panel (unchanged)

New interactions:
- **Pinch-to-zoom** → adjusts viewBox, triggers LOD changes
- **Drag-to-pan** → shifts viewBox origin
- **Double-tap** → zoom in one level, centered on tap point

### Accessibility

- Visible stations remain SVG `<g role="button" tabIndex={0}>` elements with `aria-label`
- Keyboard navigation: arrow keys to move between stations along a corridor
- `aria-live` region announces zoom level changes
- `prefers-reduced-motion`: disable animated train movement (existing behavior preserved)

### Performance

- Virtualized SVG: only nodes within viewport + 20% margin are in the DOM
- Station positions computed once on load, memoized
- Train animation loop unchanged (~10fps RAF)
- localStorage cache for station data (24h TTL) to avoid re-fetching 397 stations on every load

### Offline / Demo Mode

- If NS API unavailable: fall back to hardcoded subset of stations (current 18) with schematic positions
- Corridor definitions are static — always available
- Graceful degradation: map works with fewer stations, just less detail

## Out of Scope

- Historical simulation / playback
- Real-time position of all trains (requires OVapi/NDOV, separate feature)
- Custom visual settings (line thickness, font selection)
- International stations
