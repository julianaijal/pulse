import { SCHEMATIC_ANCHORS } from '../_data/schematic-anchors';
import { CORRIDORS, Corridor } from '../_data/corridors';

export interface SchematicPosition {
  x: number;
  y: number;
}

const PRIORITY: Record<string, number> = {
  MEGA_STATION: 6,
  KNOOPPUNT_INTERCITY_STATION: 5,
  INTERCITY_STATION: 4,
  KNOOPPUNT_SNELTREIN_STATION: 3,
  SNELTREIN_STATION: 2,
  KNOOPPUNT_STOPTREIN_STATION: 1,
  STOPTREIN_STATION: 0,
  FACULTATIEF_STATION: 0,
};

/**
 * Corridor priority: IC > ICD > SPR. When a station appears on multiple
 * corridors, it gets its position from the highest-priority one.
 */
function corridorPriority(c: Corridor): number {
  if (c.category === 'IC') return 2;
  if (c.category === 'ICD') return 2;
  return 1;
}

/**
 * Build a position map for all stations across all corridors.
 *
 * Algorithm:
 * 1. Anchored stations get their position directly from SCHEMATIC_ANCHORS.
 * 2. For each corridor, find consecutive anchor pairs and interpolate
 *    intermediate stations evenly along the straight line between them.
 * 3. When a station appears in multiple corridors, keep the position from
 *    the higher-priority corridor.
 */
export function buildSchematicLayout(): Map<string, SchematicPosition> {
  const positions = new Map<string, SchematicPosition>();
  const positionSource = new Map<string, number>(); // track priority

  // Phase 1: place all anchored stations
  for (const [code, [x, y]] of Object.entries(SCHEMATIC_ANCHORS)) {
    positions.set(code, { x, y });
    positionSource.set(code, 100); // anchors always win
  }

  // Phase 2: sort corridors by priority (IC first)
  const sorted = [...CORRIDORS].sort(
    (a, b) => corridorPriority(b) - corridorPriority(a),
  );

  for (const corridor of sorted) {
    const priority = corridorPriority(corridor);
    const { stations } = corridor;

    // Find anchor indices within this corridor
    const anchorIndices: number[] = [];
    for (let i = 0; i < stations.length; i++) {
      if (SCHEMATIC_ANCHORS[stations[i]]) {
        anchorIndices.push(i);
      }
    }

    if (anchorIndices.length < 2) {
      // Corridor has fewer than 2 anchors — place non-anchored stations
      // relative to whichever single anchor exists, or skip.
      if (anchorIndices.length === 1) {
        const anchorIdx = anchorIndices[0];
        const anchor = SCHEMATIC_ANCHORS[stations[anchorIdx]];
        // Place stations before the anchor going "up", after going "down"
        for (let i = 0; i < stations.length; i++) {
          const code = stations[i];
          if (positions.has(code)) continue;
          const offset = (i - anchorIdx) * 20;
          positions.set(code, { x: anchor[0], y: anchor[1] + offset });
          positionSource.set(code, priority);
        }
      }
      continue;
    }

    // Interpolate between consecutive anchor pairs
    for (let a = 0; a < anchorIndices.length - 1; a++) {
      const startIdx = anchorIndices[a];
      const endIdx = anchorIndices[a + 1];
      const startCode = stations[startIdx];
      const endCode = stations[endIdx];
      const startPos = SCHEMATIC_ANCHORS[startCode];
      const endPos = SCHEMATIC_ANCHORS[endCode];

      const segmentLength = endIdx - startIdx;
      if (segmentLength <= 1) continue;

      for (let i = startIdx + 1; i < endIdx; i++) {
        const code = stations[i];
        const existing = positionSource.get(code) ?? -1;
        if (existing >= priority && positions.has(code)) continue;

        const t = (i - startIdx) / segmentLength;
        positions.set(code, {
          x: startPos[0] + (endPos[0] - startPos[0]) * t,
          y: startPos[1] + (endPos[1] - startPos[1]) * t,
        });
        positionSource.set(code, priority);
      }
    }

    // Handle stations before the first anchor
    const firstAnchorIdx = anchorIndices[0];
    if (firstAnchorIdx > 0) {
      const anchorCode = stations[firstAnchorIdx];
      const anchorPos = SCHEMATIC_ANCHORS[anchorCode];
      // If there's a second anchor, extend in the opposite direction
      let dx = 0, dy = -20;
      if (anchorIndices.length >= 2) {
        const nextAnchor = SCHEMATIC_ANCHORS[stations[anchorIndices[1]]];
        const segLen = anchorIndices[1] - firstAnchorIdx;
        dx = -(nextAnchor[0] - anchorPos[0]) / segLen;
        dy = -(nextAnchor[1] - anchorPos[1]) / segLen;
      }
      for (let i = firstAnchorIdx - 1; i >= 0; i--) {
        const code = stations[i];
        const existing = positionSource.get(code) ?? -1;
        if (existing >= priority && positions.has(code)) continue;
        const dist = firstAnchorIdx - i;
        positions.set(code, {
          x: anchorPos[0] + dx * dist,
          y: anchorPos[1] + dy * dist,
        });
        positionSource.set(code, priority);
      }
    }

    // Handle stations after the last anchor
    const lastAnchorIdx = anchorIndices[anchorIndices.length - 1];
    if (lastAnchorIdx < stations.length - 1) {
      const anchorCode = stations[lastAnchorIdx];
      const anchorPos = SCHEMATIC_ANCHORS[anchorCode];
      let dx = 0, dy = 20;
      if (anchorIndices.length >= 2) {
        const prevAnchor = SCHEMATIC_ANCHORS[stations[anchorIndices[anchorIndices.length - 2]]];
        const segLen = lastAnchorIdx - anchorIndices[anchorIndices.length - 2];
        dx = (anchorPos[0] - prevAnchor[0]) / segLen;
        dy = (anchorPos[1] - prevAnchor[1]) / segLen;
      }
      for (let i = lastAnchorIdx + 1; i < stations.length; i++) {
        const code = stations[i];
        const existing = positionSource.get(code) ?? -1;
        if (existing >= priority && positions.has(code)) continue;
        const dist = i - lastAnchorIdx;
        positions.set(code, {
          x: anchorPos[0] + dx * dist,
          y: anchorPos[1] + dy * dist,
        });
        positionSource.set(code, priority);
      }
    }
  }

  return positions;
}

/**
 * Determine the zoom level at which a station becomes visible.
 */
export function stationZoomLevel(stationType?: string): number {
  switch (stationType) {
    case 'MEGA_STATION':
      return 1;
    case 'KNOOPPUNT_INTERCITY_STATION':
    case 'INTERCITY_STATION':
      return 2;
    case 'KNOOPPUNT_SNELTREIN_STATION':
    case 'SNELTREIN_STATION':
    case 'KNOOPPUNT_STOPTREIN_STATION':
      return 3;
    default:
      return 4;
  }
}

/**
 * Station visual radius based on type.
 */
export function stationRadius(stationType?: string): number {
  switch (stationType) {
    case 'MEGA_STATION':
      return 6;
    case 'KNOOPPUNT_INTERCITY_STATION':
      return 4.5;
    case 'INTERCITY_STATION':
      return 3.5;
    case 'KNOOPPUNT_SNELTREIN_STATION':
    case 'KNOOPPUNT_STOPTREIN_STATION':
      return 3;
    default:
      return 2;
  }
}

export { PRIORITY as STATION_PRIORITY };
