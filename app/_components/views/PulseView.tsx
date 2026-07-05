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
    // Continuously moving trains violate WCAG 2.2.2 (no pause) and are
    // untappable moving targets; freeze positions under reduced motion.
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

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

  const filteredTrains = trains.filter(tr => {
    if (filter === 'ic') return tr.cat === 'IC' || tr.cat === 'ICD';
    if (filter === 'spr') return tr.cat === 'SPR';
    if (filter === 'delayed') return tr.delayMin >= 3;
    return true;
  });

  const activeDisruptions = disruptions.filter(d => d.severity > 0.3);

  return (
    <div className="view fade-up" style={{ paddingBottom: 0 }}>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {activeDisruptions.map(d => d.label).join(', ')}
      </div>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {selected ? `Train ${selected.id} selected: ${selected.from.name} to ${selected.to.name}${selected.delayMin > 0 ? `, ${selected.delayMin} min delay` : ''}.` : ''}
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
      </div>

      {/* Map + disruptions */}
      <div className="pulse-map-layout">
        <div className="pulse-map-area" style={{ position: 'relative', padding: '0 18px' }}>
          <div className="card" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <svg
              viewBox="0 0 420 540"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Map of the Dutch rail network with live train positions and disruptions."
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
                    {/* Enlarged invisible hit area (WCAG 2.5.8) */}
                    <circle cx={x} cy={y} r={12} fill="transparent" />
                    <circle cx={x} cy={y} r={3.5} fill="var(--ink)" style={{ pointerEvents: 'none' }} />
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
                    aria-label={`Train ${tr.id} (${tr.cat}): ${tr.from.name} to ${tr.to.name}${tr.delayMin > 0 ? `, ${tr.delayMin} min delay` : ', on time'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelected(tr)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(tr); } }}
                  >
                    {/* Enlarged invisible hit area (WCAG 2.5.8) */}
                    <circle cx={x} cy={y} r={12} fill="transparent" />
                    <circle cx={x} cy={y} r={4.5}
                      fill={isDelayed ? 'var(--warn)' : 'var(--primary)'}
                      stroke="#FFFFFF" strokeWidth="1.5" style={{ pointerEvents: 'none' }} />
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
