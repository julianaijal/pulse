'use client';

import React, { useState, useEffect } from 'react';
import { IDeparture, IStop, ITweaks } from '../../interfaces/interfaces';
import { IconBack } from '../icons/Icons';
import CrowdingStrip from '../shared/CrowdingStrip';
import Loader from '../_partials/Loader';

interface JourneyViewProps {
  train: IDeparture | null;
  fromCode?: string;
  tweaks: ITweaks;
  onBack: () => void;
  onNavigate: (tab: 'rhythm' | 'search') => void;
}

function quietestIdx(crowding: number[]): number {
  let min = 1, idx = 0;
  crowding.forEach((c, i) => { if (c < min) { min = c; idx = i; } });
  return idx;
}

export default function JourneyView({ train, fromCode, tweaks, onBack, onNavigate }: JourneyViewProps) {
  const [stops, setStops] = useState<IStop[] | null>(null);
  const [stopsFailed, setStopsFailed] = useState(false);

  const rawTrainId = train?.trainId;
  const trainId =
    rawTrainId != null && /^\d+$/.test(String(rawTrainId)) ? String(rawTrainId) : null;

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
        <div style={{ padding: '18px 20px 6px' }}>
          <button onClick={onBack} style={{ padding: '6px 0', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconBack aria-hidden="true" style={{ width: 18, height: 18 }} />
            <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Back</span>
          </button>
        </div>
        <div style={{ padding: '6px 20px' }}>
          <h1 className="serif" style={{ fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Geen actieve reis
          </h1>
          <p style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: 360 }}>
            Kies een trein in{' '}
            <button onClick={() => onNavigate('rhythm')} style={{ color: 'var(--accent)', textDecoration: 'underline', padding: 0, fontSize: 13 }}>
              Rhythm
            </button>
            {' '}of{' '}
            <button onClick={() => onNavigate('search')} style={{ color: 'var(--accent)', textDecoration: 'underline', padding: 0, fontSize: 13 }}>
              Zoeken
            </button>
            {' '}om hem hier te volgen.
          </p>
        </div>
      </div>
    );
  }

  const hereIdx = stops && fromCode ? stops.findIndex(s => s.code === fromCode) : -1;
  const originName = stops ? (hereIdx >= 0 ? stops[hereIdx].name : stops[0].name) : null;
  const crowding = train.crowding;
  const actual = new Date(train.actualDateTime);

  return (
    <div className="view fade-up">
      {/* Header */}
      <div style={{ padding: '18px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ padding: '6px 0', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconBack aria-hidden="true" style={{ width: 18, height: 18 }} />
          <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Back</span>
        </button>
        <span className="now-pill"><span className="dot live" /> tracking</span>
      </div>

      {/* Big headline */}
      <div style={{ padding: '6px 20px 20px' }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          {train.trainCategory}{train.trainId ? ` · TRAIN ${train.trainId}` : ''}
        </div>
        <h1 className="serif" style={{ fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          {originName && (
            <>
              <em style={{ fontStyle: 'italic' }}>{originName}</em>
              <span style={{ color: 'var(--ink-3)' }}> → </span>
            </>
          )}
          <em style={{ fontStyle: 'italic' }}>{train.direction}</em>
        </h1>
        <div style={{ marginTop: 10, display: 'flex', gap: 14, alignItems: 'baseline' }}>
          <div className="serif num" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
            {actual.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="mono" style={{ fontSize: 12, color: train.delayMinutes > 0 ? 'var(--accent)' : 'var(--ok-text)' }}>
            {train.delayMinutes > 0 ? `+${train.delayMinutes} min` : 'on time'}
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            TRACK {train.actualTrack}
          </div>
        </div>
      </div>

      {/* Platform choreography — only when real crowding data exists */}
      {crowding && crowding.length > 0 && (
        <PlatformCard crowding={crowding} train={train} tweaks={tweaks} />
      )}

      {/* Timeline */}
      <div style={{ padding: '24px 20px 0' }}>
        <h2 className="eyebrow" style={{ marginBottom: 12 }}>
          Journey timeline{stops ? ` · ${stops.length} stops` : ''}
        </h2>
        {stops ? (
          <ol style={{ position: 'relative', listStyle: 'none', padding: 0, margin: 0 }}>
            {stops.map((s, i) => (
              <li key={`${s.code}-${i}`}>
                <StopRow stop={s} here={i === hereIdx} last={i === stops.length - 1} />
              </li>
            ))}
          </ol>
        ) : stopsFailed ? (
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            Stops unavailable
          </div>
        ) : (
          <Loader />
        )}
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}

function PlatformCard({ crowding, train, tweaks }: {
  crowding: number[];
  train: IDeparture;
  tweaks: ITweaks;
}) {
  const quietest = quietestIdx(crowding);
  return (
    <div style={{ padding: '0 20px 4px' }}>
      <h2 className="eyebrow" style={{ marginBottom: 10 }}>Platform choreography</h2>
      <div className="card" style={{ padding: 16 }}>
        <div className="serif" style={{ fontSize: 18, lineHeight: 1.3 }}>
          Stand at the <em>{quietest < crowding.length / 2 ? 'front' : 'back'}</em> of Track {train.actualTrack}.
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.45 }}>
          Car <strong>{quietest + 1}</strong> is quietest right now. It&apos;ll stop near the{' '}
          <strong>{quietest < crowding.length / 2 ? 'north' : 'south'}</strong> end of the platform.
        </div>

        <div aria-hidden="true" style={{ marginTop: 16 }}>
          <PlatformDiagram
            crowding={crowding}
            highlight={quietest}
            quietCar={train.quietCarriage ?? null}
            firstClass={train.firstClassCars ?? []}
          />
        </div>

        {tweaks.verbosity === 'rich' && (
          <div style={{ marginTop: 14 }}>
            <CrowdingStrip crowding={crowding} style="bars" />
          </div>
        )}
      </div>
    </div>
  );
}

function PlatformDiagram({ crowding, highlight, quietCar, firstClass }: {
  crowding: number[];
  highlight: number;
  quietCar: number | null;
  firstClass: number[];
}) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 4 }}>
        {crowding.map((_, i) => {
          const isFirst = firstClass.includes(i);
          const isQuiet = quietCar === i;
          const isHi = highlight === i;
          return (
            <div key={i} style={{
              flex: 1, height: 44, borderRadius: 5,
              background: isHi ? 'var(--ink)' : 'var(--bg-3)',
              color: isHi ? 'var(--bg)' : 'var(--ink-2)',
              border: `1px solid ${isHi ? 'var(--ink)' : 'var(--line)'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              position: 'relative', fontSize: 10,
            }}>
              <span className="mono" style={{ fontSize: 10, fontWeight: 600 }}>{i + 1}</span>
              {isFirst && <span className="mono" style={{ fontSize: 8, opacity: 0.6 }}>1ST</span>}
              {isQuiet && !isFirst && <span className="mono" style={{ fontSize: 8, opacity: 0.6 }}>QUIET</span>}
              {isHi && (
                <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: 12 }}>↓</div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>← FRONT · North end</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>South end · BACK →</span>
      </div>
    </div>
  );
}

function StopRow({ stop, here, last }: { stop: IStop; here: boolean; last: boolean }) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const delayed = new Date(stop.actualTime).getTime() !== new Date(stop.plannedTime).getTime();
  const destination = stop.status === 'DESTINATION';

  return (
    <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
      <div style={{ width: 60, textAlign: 'right', paddingTop: 8 }}>
        <div className="mono num" style={{ fontSize: 13, fontWeight: 500 }}>{fmt(stop.actualTime)}</div>
        {delayed && (
          <div className="mono num" style={{ fontSize: 10.5, color: 'var(--ink-3)', textDecoration: 'line-through' }}>{fmt(stop.plannedTime)}</div>
        )}
      </div>

      <div style={{ position: 'relative', width: 18, flexShrink: 0 }}>
        <div style={{ position: 'absolute', left: 8, top: 0, bottom: last ? '50%' : 0, width: 1.5, background: 'var(--line)' }} />
        <div style={{
          position: 'absolute', left: 4, top: 10,
          width: 10, height: 10, borderRadius: '50%',
          background: here ? 'var(--accent)' : 'var(--bg)',
          border: `1.5px solid ${here || destination ? 'var(--ink)' : 'var(--ink-3)'}`,
          boxShadow: here ? '0 0 0 4px var(--accent-dim)' : 'none',
        }} />
      </div>

      <div style={{ flex: 1, padding: '6px 0 18px' }}>
        <div className="serif" style={{
          fontSize: here || destination ? 18 : 16,
          lineHeight: 1.2,
          fontStyle: here ? 'italic' : 'normal',
          color: here ? 'var(--accent)' : 'var(--ink)',
        }}>
          {stop.name}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{stop.code}</span>
          {stop.track && (
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>· TRACK {stop.track}</span>
          )}
        </div>
      </div>
    </div>
  );
}
