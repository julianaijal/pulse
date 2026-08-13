'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { IDeparture, IActiveTrain, IDisruption } from '../../interfaces/interfaces';
import { generateActiveTrains, generateDisruptions } from '../../_utils/mock';
import { useStations } from '../../_hooks/useStations';
import { buildSchematicLayout, stationZoomLevel, stationRadius } from '../../_utils/schematic';
import { CORRIDORS } from '../../_data/corridors';
import { IconClose, IconArrow } from '../icons/Icons';
import NowPill from '../shared/NowPill';

interface PulseViewProps {
  onOpenJourney: (train: IDeparture) => void;
  onOpenStation: (station: { code: string; name: string; lat?: number; lng?: number }) => void;
}

// Full schematic grid: 1000×1400
const FULL_W = 1000;
const FULL_H = 1400;
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

// Simplified NL silhouette (original viewBox 420×540, will be transformed to fit schematic grid)
const NL_PATH = 'M5.3,443.6 L21,385.7 L42,376.1 L94.5,405 L136.5,395.4 L183.8,395.4 L199.5,443.6 L262.5,520.7 L294,511.1 L283.5,443.6 L304.5,385.7 L325.5,318.2 L399,241.1 L409.5,173.6 L367.5,106.1 L383.3,57.9 L409.5,38.6 L357,0 L273,9.6 L199.5,19.3 L147,77.1 L183.8,125.4 L152.3,192.9 L131.3,221.8 L94.5,270 L63,337.5 L21,376.1 Z';

// Zoom level thresholds for LOD
function currentLOD(zoom: number): number {
  if (zoom >= 5) return 4;
  if (zoom >= 2.5) return 3;
  if (zoom >= 1.4) return 2;
  return 1;
}

type Filter = 'all' | 'ic' | 'spr' | 'delayed';

// Landmark stations always labeled regardless of zoom
const LANDMARKS = new Set(['ASD', 'UT', 'RTD', 'GVC', 'EHV', 'GN']);

// Simple label collision detection: greedy placement, skip overlapping labels
interface LabelRect { x: number; y: number; w: number; h: number }
function labelsOverlap(a: LabelRect, b: LabelRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const ONBOARDING_KEY = 'pulse.mapOnboarded';

export default function PulseView({ onOpenJourney, onOpenStation }: PulseViewProps) {
  const { stations } = useStations();
  const [trains, setTrains] = useState<IActiveTrain[]>(() => generateActiveTrains(40));
  const [disruptions, setDisruptions] = useState<IDisruption[]>(() => generateDisruptions());
  const [selected, setSelected] = useState<IActiveTrain | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const [hoveredTrain, setHoveredTrain] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(ONBOARDING_KEY);
  });
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  // Zoom/pan state
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  // Build layout once
  const layout = useMemo(() => buildSchematicLayout(), []);

  // Station lookup by code
  const stationByCode = useMemo(() => {
    const map = new Map<string, typeof stations[0]>();
    for (const s of stations) map.set(s.code, s);
    return map;
  }, [stations]);

  // Compute viewBox from zoom and pan
  const vw = FULL_W / zoom;
  const vh = FULL_H / zoom;
  const vx = Math.max(0, Math.min(FULL_W - vw, (FULL_W - vw) / 2 + pan.x));
  const vy = Math.max(0, Math.min(FULL_H - vh, (FULL_H - vh) / 2 + pan.y));
  const viewBox = `${vx} ${vy} ${vw} ${vh}`;

  const lod = currentLOD(zoom);

  // Disruption polling (unchanged)
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch('/api/disruptions')
        .then(r => (r.ok ? r.json() : null))
        .then((data: IDisruption[] | null) => {
          if (!cancelled && Array.isArray(data) && data.length > 0) setDisruptions(data);
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Train animation (unchanged)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const FRAME_MS = 100;
    const loop = (ts: number) => {
      const dt = ts - lastTsRef.current;
      if (dt >= FRAME_MS) {
        lastTsRef.current = ts;
        setTrains(prev => prev.map(tr => {
          let t = tr.t + tr.speed * dt;
          if (t > 1) t = 0;
          return { ...tr, t };
        }));
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    const start = () => {
      if (rafRef.current != null) return;
      lastTsRef.current = performance.now();
      rafRef.current = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
    const sync = () => { if (mq.matches) stop(); else start(); };
    sync();
    mq.addEventListener('change', sync);
    return () => { mq.removeEventListener('change', sync); stop(); };
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, '1');
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    setZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * (1 + delta))));
    dismissOnboarding();
  }, [dismissOnboarding]);

  // Mouse drag pan
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return; // handled by touch events
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [pan.x, pan.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || e.pointerType === 'touch') return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = (FULL_W / zoom) / rect.width;
    const scaleY = (FULL_H / zoom) / rect.height;
    const dx = -(e.clientX - dragRef.current.startX) * scaleX;
    const dy = -(e.clientY - dragRef.current.startY) * scaleY;
    setPan({ x: dragRef.current.startPanX + dx, y: dragRef.current.startPanY + dy });
  }, [zoom]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Touch pinch-to-zoom + pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), zoom };
    } else if (e.touches.length === 1) {
      dragRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, startPanX: pan.x, startPanY: pan.y };
    }
  }, [zoom, pan.x, pan.y]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchRef.current.zoom * (dist / pinchRef.current.dist)));
      setZoom(newZoom);
      dismissOnboarding();
    } else if (e.touches.length === 1 && dragRef.current) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = (FULL_W / zoom) / rect.width;
      const scaleY = (FULL_H / zoom) / rect.height;
      const dx = -(e.touches[0].clientX - dragRef.current.startX) * scaleX;
      const dy = -(e.touches[0].clientY - dragRef.current.startY) * scaleY;
      setPan({ x: dragRef.current.startPanX + dx, y: dragRef.current.startPanY + dy });
    }
  }, [zoom, dismissOnboarding]);

  const handleTouchEnd = useCallback(() => {
    dragRef.current = null;
    pinchRef.current = null;
  }, []);

  // Double-tap to zoom
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setZoom(z => {
      const next = z < 2 ? 2.5 : z < 4 ? 5 : MIN_ZOOM;
      if (next === MIN_ZOOM) setPan({ x: 0, y: 0 });
      return next;
    });
    dismissOnboarding();
  }, [dismissOnboarding]);

  const filteredTrains = trains.filter(tr => {
    if (filter === 'ic') return tr.cat === 'IC' || tr.cat === 'ICD';
    if (filter === 'spr') return tr.cat === 'SPR';
    if (filter === 'delayed') return tr.delayMin >= 3;
    return true;
  });

  const activeDisruptions = disruptions.filter(d => d.severity > 0.3);

  // Visible corridor segments (only render corridors that have stations at current LOD)
  const visibleCorridors = useMemo(() => {
    return CORRIDORS.filter(c => {
      if (filter === 'ic' && c.category === 'SPR') return false;
      if (filter === 'spr' && c.category !== 'SPR') return false;
      return true;
    });
  }, [filter]);

  // Route stroke width based on category
  const routeStroke = (cat: string) => {
    if (cat === 'ICD') return 3.5 / zoom;
    if (cat === 'IC') return 3 / zoom;
    return 1.5 / zoom;
  };

  return (
    <div className="view fade-up" style={{ paddingBottom: 0 }}>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {activeDisruptions.map(d => d.label).join(', ')}
      </div>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {selected ? `Train ${selected.id} selected: ${selected.from.name} to ${selected.to.name}${selected.delayMin > 0 ? `, ${selected.delayMin} min delay` : ''}.` : ''}
      </div>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Zoom level {lod} of 4
      </div>

      {/* Header */}
      <div style={{ padding: '24px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em' }}>Network</h1>
        <NowPill label={`${trains.length} trains live`} />
      </div>

      {/* Filter chips */}
      <div style={{ padding: '0 18px 12px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {([['all','All'],['ic','Intercity'],['spr','Sprinter'],['delayed','Delayed']] as [Filter,string][]).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} aria-pressed={filter === id} style={{
            padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            background: filter === id ? (id === 'delayed' ? 'transparent' : 'var(--ink)') : 'var(--card)',
            color: filter === id ? (id === 'delayed' ? 'var(--warn-text)' : '#FFFFFF') : (id === 'delayed' ? 'var(--warn-text)' : 'var(--ink-2)'),
            border: `1px solid ${filter === id && id !== 'delayed' ? 'var(--ink)' : id === 'delayed' ? 'var(--warn-border)' : 'var(--line)'}`,
          }}>
            {label}
          </button>
        ))}
        {zoom > 1.1 && (
          <button onClick={() => { setZoom(MIN_ZOOM); setPan({ x: 0, y: 0 }); }} style={{
            padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            background: 'var(--card)', color: 'var(--ink-3)', border: '1px solid var(--line)',
          }}>
            Reset zoom
          </button>
        )}
      </div>

      {/* Map + disruptions */}
      <div className="pulse-map-layout">
        <div className="pulse-map-area" style={{ position: 'relative', padding: '0 18px' }}>
          <div className="card" style={{ borderRadius: 20, overflow: 'hidden', touchAction: 'none' }}>
            <svg
              ref={svgRef}
              viewBox={viewBox}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Schematic map of the Dutch rail network with live train positions."
              style={{ width: '100%', height: 'auto', display: 'block', cursor: zoom > 1.1 ? 'grab' : 'default', background: 'var(--map-land)' }}
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
            >
              {/* NL silhouette (subtle background) */}
              <g transform="translate(80, 50) scale(1.55, 2.15)" opacity={0.07}>
                <path d={NL_PATH} fill="var(--ink)" stroke="none" />
              </g>

              {/* Corridor lines */}
              {visibleCorridors.map(corridor => {
                const points: [number, number][] = [];
                for (const code of corridor.stations) {
                  const pos = layout.get(code);
                  if (pos) points.push([pos.x, pos.y]);
                }
                if (points.length < 2) return null;
                return (
                  <g key={corridor.id}>
                    {points.map((p, i) => {
                      if (i === 0) return null;
                      return (
                        <line key={i} x1={points[i-1][0]} y1={points[i-1][1]} x2={p[0]} y2={p[1]}
                          stroke={corridor.color} strokeWidth={routeStroke(corridor.category)}
                          strokeLinecap="round" opacity={corridor.category === 'SPR' ? 0.5 : 0.85}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* Stations (virtualized: only render visible at current LOD, with collision-aware labels) */}
              {(() => {
                const placed: LabelRect[] = [];
                // Sort: landmarks and interchanges first so they claim label space
                const entries = Array.from(layout.entries()).sort(([codeA, ], [codeB, ]) => {
                  const sa = stationByCode.get(codeA);
                  const sb = stationByCode.get(codeB);
                  const pa = LANDMARKS.has(codeA) ? 0 : sa?.stationType === 'MEGA_STATION' ? 1 : sa?.stationType?.includes('KNOOPPUNT') ? 2 : 3;
                  const pb = LANDMARKS.has(codeB) ? 0 : sb?.stationType === 'MEGA_STATION' ? 1 : sb?.stationType?.includes('KNOOPPUNT') ? 2 : 3;
                  return pa - pb;
                });

                return entries.map(([code, pos]) => {
                  const s = stationByCode.get(code);
                  const zl = stationZoomLevel(s?.stationType);
                  const isLandmark = LANDMARKS.has(code);
                  // Landmarks always visible; others follow LOD
                  if (!isLandmark && zl > lod) return null;

                  // Viewport culling
                  if (pos.x < vx - 50 || pos.x > vx + vw + 50 || pos.y < vy - 50 || pos.y > vy + vh + 50) return null;

                  const r = stationRadius(s?.stationType) / zoom;
                  const isInterchange = s?.stationType?.includes('KNOOPPUNT') || s?.stationType === 'MEGA_STATION';
                  const wantsLabel = isLandmark || (zl <= lod && (isInterchange || lod >= 3));
                  const fontSize = Math.max(6, 10 / zoom);
                  const hitR = Math.max(r * 2, 12 / zoom);
                  const isHovered = hoveredStation === code;

                  // Label collision check
                  let showLabel = false;
                  const labelText = s?.name?.replace(' Centraal', ' C').replace('Amsterdam ', "A'dam ").replace('Rotterdam ', "R'dam ").replace('Den Haag ', 'DH ') ?? code;
                  if (wantsLabel) {
                    const labelW = labelText.length * fontSize * 0.55;
                    const labelH = fontSize * 1.2;
                    const labelX = pos.x + r + 4 / zoom;
                    const labelY = pos.y - labelH * 0.5;
                    const rect: LabelRect = { x: labelX, y: labelY, w: labelW, h: labelH };
                    const collides = placed.some(p => labelsOverlap(p, rect));
                    if (!collides || isLandmark) {
                      showLabel = true;
                      placed.push(rect);
                    }
                  }

                  return (
                    <g key={code}
                      role="button" tabIndex={0}
                      aria-label={`Station ${s?.name ?? code}`}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); if (s) onOpenStation(s); }}
                      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && s) { e.preventDefault(); onOpenStation(s); } }}
                      onPointerEnter={() => setHoveredStation(code)}
                      onPointerLeave={() => setHoveredStation(prev => prev === code ? null : prev)}
                      onFocus={() => setHoveredStation(code)}
                      onBlur={() => setHoveredStation(prev => prev === code ? null : prev)}
                    >
                      <circle cx={pos.x} cy={pos.y} r={hitR} fill="transparent" />
                      {/* Hover/focus ring */}
                      {isHovered && (
                        <circle cx={pos.x} cy={pos.y} r={r + 3 / zoom} fill="none" stroke="var(--primary)" strokeWidth={1.5 / zoom} opacity={0.6} style={{ pointerEvents: 'none' }} />
                      )}
                      {isInterchange ? (
                        <circle cx={pos.x} cy={pos.y} r={r} fill="var(--card)" stroke={isHovered ? 'var(--primary)' : 'var(--ink)'} strokeWidth={1.5 / zoom} style={{ pointerEvents: 'none' }} />
                      ) : (
                        <circle cx={pos.x} cy={pos.y} r={r} fill={isHovered ? 'var(--primary)' : 'var(--ink)'} style={{ pointerEvents: 'none' }} />
                      )}
                      {showLabel && (
                        <text x={pos.x + r + 4 / zoom} y={pos.y + fontSize * 0.35} fontSize={fontSize} fontWeight={isInterchange || isLandmark ? 700 : 500} fill="var(--ink)" style={{ pointerEvents: 'none' }}>
                          {labelText}
                        </text>
                      )}
                      {/* Tooltip on hover when label is hidden */}
                      {isHovered && !showLabel && (
                        <g style={{ pointerEvents: 'none' }}>
                          <rect x={pos.x - (labelText.length * fontSize * 0.55) / 2} y={pos.y - r - fontSize * 1.8} width={labelText.length * fontSize * 0.55 + 6 / zoom} height={fontSize * 1.4} rx={3 / zoom} fill="var(--ink)" opacity={0.85} />
                          <text x={pos.x + 3 / zoom} y={pos.y - r - fontSize * 0.65} fontSize={fontSize} fontWeight={600} fill="var(--card)" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                            {labelText}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                });
              })()}

              {/* Trains */}
              {filteredTrains.map(tr => {
                const fp = layout.get(tr.from.code);
                const tp = layout.get(tr.to.code);
                if (!fp || !tp) return null;
                const x = fp.x + (tp.x - fp.x) * tr.t;
                const y = fp.y + (tp.y - fp.y) * tr.t;
                if (x < vx - 20 || x > vx + vw + 20 || y < vy - 20 || y > vy + vh + 20) return null;
                const isDelayed = tr.delayMin >= 3;
                const isSel = selected?.id === tr.id;
                const isTrainHovered = hoveredTrain === tr.id;
                const trainR = 4.5 / zoom;
                const trainLabel = `${tr.cat} → ${tr.to.name}${isDelayed ? ` (+${tr.delayMin})` : ''}`;
                const trainFontSize = Math.max(6, 9 / zoom);
                return (
                  <g key={tr.id}
                    role="button" tabIndex={0}
                    aria-label={`Train ${tr.id} (${tr.cat}): ${tr.from.name} to ${tr.to.name}${tr.delayMin > 0 ? `, ${tr.delayMin} min delay` : ', on time'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); setSelected(tr); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(tr); } }}
                    onPointerEnter={() => setHoveredTrain(tr.id)}
                    onPointerLeave={() => setHoveredTrain(prev => prev === tr.id ? null : prev)}
                  >
                    <circle cx={x} cy={y} r={12 / zoom} fill="transparent" />
                    <circle cx={x} cy={y} r={trainR}
                      fill={isDelayed ? 'var(--warn)' : 'var(--primary)'}
                      stroke="#FFFFFF" strokeWidth={1.5 / zoom} style={{ pointerEvents: 'none' }} />
                    {(isSel || isTrainHovered) && <circle cx={x} cy={y} r={10 / zoom} fill="none" stroke={isDelayed ? 'var(--warn)' : 'var(--primary)'} strokeWidth={1.5 / zoom} />}
                    {/* Train tooltip on hover */}
                    {isTrainHovered && !isSel && (
                      <g style={{ pointerEvents: 'none' }}>
                        <rect x={x + 8 / zoom} y={y - trainFontSize * 1.1} width={trainLabel.length * trainFontSize * 0.55 + 8 / zoom} height={trainFontSize * 1.5} rx={3 / zoom} fill={isDelayed ? 'var(--warn)' : 'var(--primary)'} opacity={0.9} />
                        <text x={x + 12 / zoom} y={y + trainFontSize * 0.1} fontSize={trainFontSize} fontWeight={700} fill="#FFFFFF">
                          {trainLabel}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Legend (only at default zoom) */}
              {zoom < 1.3 && (
                <g transform={`translate(${vx + 16}, ${vy + vh - 30})`}>
                  <circle cx={0} cy={0} r={4} fill="var(--primary)" />
                  <text x={8} y={4} fontSize="10" fontWeight="600" fill="var(--ink-3)">on time</text>
                  <circle cx={65} cy={0} r={4} fill="var(--warn)" />
                  <text x={73} y={4} fontSize="10" fontWeight="600" fill="var(--ink-3)">delayed</text>
                </g>
              )}
            </svg>

            {/* Onboarding hint */}
            {showOnboarding && (
              <div
                onClick={dismissOnboarding}
                style={{
                  position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--ink)', color: '#FFFFFF', padding: '8px 16px',
                  borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                  opacity: 0.85, cursor: 'pointer', animation: 'fadeUp 0.4s',
                }}
              >
                Pinch or scroll to explore all stations
              </div>
            )}

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
                      {selected.delayMin > 0 ? `+${selected.delayMin} min late` : 'On time'} · {Math.round(selected.t * 100)}% of the way there
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} aria-label="Close train card" style={{ padding: 4, color: 'var(--ink-3)' }}>
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
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--warn-text)', whiteSpace: 'nowrap' }}>{d.impact}</span>
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
