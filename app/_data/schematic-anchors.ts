/**
 * Hand-positioned anchor stations on a schematic grid.
 *
 * Coordinate space: 0–1000 x, 0–1400 y (top-left origin).
 * Lines between anchors follow schematic rules: horizontal, vertical,
 * or 45-degree diagonals. Intermediate stations are interpolated evenly
 * along the straight segment between two anchors.
 *
 * The layout is NOT geographically accurate — distances and angles are
 * chosen for readability, like a classic metro map.
 */

export const SCHEMATIC_ANCHORS: Record<string, [number, number]> = {
  // ── North ──
  GN:   [700, 100],   // Groningen
  LW:   [400, 150],   // Leeuwarden
  ASN:  [650, 220],   // Assen

  // ── Northeast ──
  ZL:   [600, 370],   // Zwolle
  MP:   [500, 300],   // Meppel
  EMN:  [750, 300],   // Emmen
  ES:   [800, 520],   // Enschede
  HGL:  [750, 520],   // Hengelo
  AML:  [700, 500],   // Almelo
  DV:   [620, 500],   // Deventer
  ZP:   [650, 550],   // Zutphen
  APD:  [580, 550],   // Apeldoorn

  // ── Central ──
  AMF:  [480, 480],   // Amersfoort
  HVS:  [420, 490],   // Hilversum
  UT:   [400, 580],   // Utrecht Centraal
  ALM:  [400, 400],   // Almere
  LLS:  [420, 350],   // Lelystad

  // ── Amsterdam region ──
  ASD:  [320, 400],   // Amsterdam Centraal
  ASS:  [280, 380],   // Amsterdam Sloterdijk
  SHL:  [280, 460],   // Schiphol
  ASDZ: [320, 470],   // Amsterdam Zuid
  HLM:  [220, 370],   // Haarlem
  ZD:   [280, 350],   // Zaandam
  AMR:  [220, 280],   // Alkmaar
  HN:   [260, 280],   // Hoorn

  // ── East (Arnhem/Nijmegen) ──
  AH:   [580, 650],   // Arnhem
  NM:   [520, 700],   // Nijmegen
  ED:   [530, 610],   // Ede-Wageningen
  DTC:  [650, 650],   // Doetinchem
  WW:   [720, 650],   // Winterswijk

  // ── South-Holland ──
  GD:   [320, 620],   // Gouda
  LEDN: [240, 540],   // Leiden
  GVC:  [200, 590],   // Den Haag Centraal
  GV:   [200, 610],   // Den Haag HS
  DT:   [230, 640],   // Delft
  RTD:  [260, 680],   // Rotterdam Centraal
  DDR:  [300, 750],   // Dordrecht

  // ── Brabant ──
  BD:   [320, 830],   // Breda
  TB:   [380, 850],   // Tilburg
  HT:   [440, 800],   // 's-Hertogenbosch
  EHV:  [460, 900],   // Eindhoven
  HM:   [520, 920],   // Helmond
  O:    [480, 760],   // Oss

  // ── Zeeland ──
  RSD:  [240, 870],   // Roosendaal
  VS:   [160, 960],   // Vlissingen

  // ── Limburg ──
  WT:   [500, 980],   // Weert
  RM:   [540, 1060],  // Roermond
  VL:   [580, 1000],  // Venlo
  STD:  [520, 1140],  // Sittard
  HRL:  [560, 1200],  // Heerlen
  MT:   [480, 1220],  // Maastricht
};
