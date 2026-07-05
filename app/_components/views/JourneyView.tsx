'use client';

import React, { useState, useEffect } from 'react';
import { IDeparture, IStop } from '../../interfaces/interfaces';
import { IconBack } from '../icons/Icons';
import Loader from '../_partials/Loader';

interface JourneyViewProps {
  train: IDeparture | null;
  fromCode?: string;
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
          <button onClick={onBack} aria-label="Back" style={{
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
        <button onClick={onBack} aria-label="Back" style={{
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
