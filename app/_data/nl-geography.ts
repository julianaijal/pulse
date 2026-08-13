/**
 * Simplified geographic context for the schematic rail map.
 *
 * Water bodies rendered as negative space make the Netherlands instantly
 * recognizable without geographic station positions. All paths are
 * hand-drawn on the 1000×1400 schematic grid and snapped to octolinear
 * angles (0°, 45°, 90°) where possible.
 *
 * Design reference: NS Spoorkaart, Lars' Transport Maps, Beck's Thames.
 */

// ── North Sea ──
// Covers the entire western edge of the map, bounded by the coastline.
// Drawn as a large polygon that extends off-canvas to the left.
export const NORTH_SEA = [
  'M -100,-100',       // off-canvas top-left
  'L 180,-100',        // top edge
  'L 180,60',          // Wadden coast (Den Helder north)
  'L 190,140',         // Den Helder
  'L 175,200',         // coast curves west near Petten
  'L 170,280',         // Bergen/Alkmaar coast
  'L 165,370',         // Haarlem coast (west of HLM 220,370)
  'L 158,440',         // Noordwijk
  'L 155,540',         // Katwijk/Leiden coast
  'L 148,590',         // Scheveningen (west of GVC 200,590)
  'L 150,640',         // Hook of Holland
  'L 170,680',         // Maasmond
  'L 155,720',         // Europoort
  'L 140,780',         // coast south of Rotterdam
  'L 80,850',          // Zeeland north coast
  'L 60,880',          // Westerschelde north
  'L 40,920',          // Walcheren west
  'L 50,980',          // Vlissingen area
  'L 80,1020',         // Westerschelde south
  'L -100,1020',       // off-canvas bottom-left
  'Z',
].join(' ');

// ── IJsselmeer / Markermeer ──
// The distinctive inland sea. Creates the "bite" out of central-north NL.
export const IJSSELMEER = [
  'M 260,160',         // west shore (near Medemblik)
  'L 280,200',         // Enkhuizen area
  'L 260,260',         // south-west shore (near Hoorn 260,280)
  'L 290,320',         // Marken
  'L 340,370',         // near Amsterdam-Noord (west of ASD 320,400)
  'L 390,370',         // Muiderberg
  'L 410,350',         // near Almere (ALM 400,400 is south)
  'L 440,320',         // Lelystad-west (LLS 420,350 is south)
  'L 460,260',         // Lelystad-north
  'L 500,200',         // Flevoland NE coast (straight Flevopolder edge)
  'L 490,160',         // Ketelmeer / Kampen area
  'L 440,140',         // Afsluitdijk east (Kornwerderzand)
  'L 350,140',         // Afsluitdijk west (Den Oever)
  'L 280,150',         // Den Oever coast
  'Z',
].join(' ');

// ── Waddenzee ──
// Shallow sea between the mainland and the Wadden Islands.
export const WADDEN_SEA = [
  'M 180,60',          // west start (Texel south)
  'L 350,100',         // Afsluitdijk west approach
  'L 350,140',         // Afsluitdijk west (Den Oever)
  'L 440,140',         // Afsluitdijk east (Kornwerderzand)
  'L 500,110',         // Friesland coast (Harlingen area)
  'L 600,80',          // Friesland north coast
  'L 700,60',          // Groningen coast (Lauwersoog)
  'L 770,50',          // Eemshaven
  'L 770,-100',        // off-canvas top-right
  'L 180,-100',        // off-canvas top-left
  'Z',
].join(' ');

// ── Wadden Islands ──
// Simplified rectangles/parallelograms for Texel, Vlieland, Terschelling,
// Ameland, Schiermonnikoog. Decorative only (no rail service).
export const WADDEN_ISLANDS: { x: number; y: number; w: number; h: number; angle?: number }[] = [
  { x: 160, y: -10, w: 55, h: 14 },   // Texel
  { x: 260, y: -20, w: 35, h: 10 },   // Vlieland
  { x: 320, y: -25, w: 60, h: 12 },   // Terschelling
  { x: 440, y: -15, w: 45, h: 10 },   // Ameland
  { x: 540, y: -5,  w: 35, h: 9 },    // Schiermonnikoog
];

// ── Zeeland Delta ──
// The fragmented southwest: Oosterschelde, Westerschelde, and delta islands.
// Rendered as separate water channels between the islands.
export const ZEELAND_CHANNELS = [
  // Oosterschelde (between Schouwen-Duiveland and Noord-Beveland)
  [
    'M 80,830',
    'L 140,810',
    'L 200,830',
    'L 160,850',
    'L 100,850',
    'Z',
  ].join(' '),
  // Westerschelde (main shipping channel to Antwerp)
  [
    'M 60,900',
    'L 120,880',
    'L 200,900',
    'L 260,920',
    'L 200,940',
    'L 120,930',
    'L 60,920',
    'Z',
  ].join(' '),
];

// ── Land border ──
// Eastern and southern border with Germany and Belgium.
// Dashed line, less prominent than the coastline.
export const LAND_BORDER = [
  'M 770,50',          // Eemshaven / German border north
  'L 790,120',         // Groningen east
  'L 800,250',         // Drenthe east
  'L 810,350',         // Overijssel east (near Emmen 750,300)
  'L 830,450',         // Overijssel SE
  'L 840,530',         // near Enschede (ES 800,520)
  'L 800,600',         // Achterhoek
  'L 760,680',         // near Winterswijk (WW 720,650)
  'L 720,740',         // Gelderland SE
  'L 660,790',         // near Nijmegen east
  'L 620,860',         // North Brabant east
  'L 600,940',         // near Venlo (VL 580,1000)
  'L 620,1020',        // Limburg east
  'L 620,1100',        // Limburg
  'L 600,1180',        // near Heerlen (HRL 560,1200)
  'L 560,1260',        // Maastricht area
  'L 480,1280',        // south of Maastricht
  'L 420,1240',        // Belgian border south
  'L 340,1100',        // North Brabant south
  'L 280,980',         // Zeeland/Brabant border
  'L 200,940',         // near Westerschelde
].join(' ');
