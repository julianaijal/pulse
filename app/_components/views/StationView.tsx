'use client';

import React, { useState, useEffect } from 'react';
import { IDeparture } from '../../interfaces/interfaces';
import { STATIONS } from '../../_utils/mock';
import { useDepartures } from '../../_hooks/useDepartures';
import { formatTime } from '../../_utils/format';
import { IconBack, IconClose, IconSearch } from '../icons/Icons';
import FullDepartureRow from '../shared/FullDepartureRow';
import NowPill from '../shared/NowPill';
import DataSourceBanner from '../shared/DataSourceBanner';

interface StationObj {
  code: string;
  name: string;
  lat?: number;
  lng?: number;
}

interface StationViewProps {
  station: StationObj | null;
  onBack: () => void;
  onOpenJourney: (train: IDeparture, fromCode?: string) => void;
}

export function StationSearch({ onBack, onPick }: { onBack: () => void; onPick: (s: StationObj) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<StationObj[]>(STATIONS.slice(0, 8));

  useEffect(() => {
    if (q.length < 1) {
      queueMicrotask(() => setResults(STATIONS.slice(0, 8)));
      return;
    }
    const lo = q.toLowerCase();
    const local = STATIONS.filter(s => s.name.toLowerCase().includes(lo) || s.code.toLowerCase().includes(lo)).slice(0, 10);
    queueMicrotask(() => setResults(local));

    let cancelled = false;
    if (q.length >= 2) {
      fetch(`/api/stations?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(data => { if (!cancelled && Array.isArray(data) && data.length > 0) setResults(data); })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [q]);

  return (
    <div className="view fade-up">
      <div style={{ padding: '24px 18px 12px' }}>
        <h1 style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em' }}>Stations</h1>
      </div>

      {/* Search field */}
      <div style={{ padding: '0 18px' }}>
        <div className="card" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 14,
        }}>
          <IconSearch aria-hidden="true" style={{ width: 18, height: 18, color: 'var(--ink-4)', flexShrink: 0 }} />
          <label htmlFor="station-search" className="sr-only">Search stations</label>
          <input
            id="station-search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search stations..."
            style={{
              flex: 1, background: 'transparent', border: 0,
              fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear search" style={{
              width: 24, height: 24, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--subtle)', flexShrink: 0,
            }}>
              <IconClose aria-hidden="true" style={{ width: 12, height: 12, color: 'var(--ink-3)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete chips */}
      {q.length > 0 && results.length > 0 && (
        <div style={{ padding: '10px 18px 0', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {results.slice(0, 4).map(s => (
            <button key={s.code} onClick={() => onPick(s)} style={{
              padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
              background: 'var(--primary-tint)', color: 'var(--primary)',
              border: 'none',
            }}>
              {s.code} · {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Station list */}
      <div style={{ padding: '16px 18px 0' }}>
        {results.map(s => (
          <button key={s.code} onClick={() => onPick(s)} aria-label={`${s.name} (${s.code})`} style={{
            width: '100%', padding: '12px 0', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', borderBottom: '1px solid var(--line-row)', textAlign: 'left',
            background: 'transparent', transition: 'background 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--subtle)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          onFocus={e => (e.currentTarget.style.background = 'var(--subtle)')}
          onBlur={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ fontSize: 15, fontWeight: 700 }}>{s.name}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{s.code}</span>
          </button>
        ))}
      </div>
      <div style={{ height: 80 }} />
    </div>
  );
}

export default function StationView({ station, onBack, onOpenJourney }: StationViewProps) {
  const { departures, source, cachedAt, retry } = useDepartures(station?.code);

  if (!station) return null;

  const updatedStr = formatTime(new Date());

  return (
    <div className="view fade-up">
      {/* Header */}
      <div style={{ padding: '18px 18px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} aria-label="Back" className="hit-target" style={{
          position: 'relative', width: 34, height: 34, borderRadius: 17, background: 'var(--card)',
          border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IconBack aria-hidden="true" style={{ width: 16, height: 16, color: 'var(--ink)' }} />
        </button>
      </div>

      {/* Station info */}
      <div style={{ padding: '12px 18px 0' }}>
        <h1 style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>{station.name}</h1>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>updated {updatedStr}</span>
          <NowPill label="live board" />
        </div>
      </div>

      {/* Departures live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {departures ? `${departures.length} departures loaded` : ''}
      </div>

      {/* Stale/demo-data notice */}
      {(source === 'demo' || source === 'cached') && (
        <div style={{ padding: '12px 18px 0' }}>
          <DataSourceBanner variant={source} cachedAt={cachedAt} onRetry={retry} />
        </div>
      )}

      {/* Board */}
      <div style={{ padding: '16px 18px 0' }}>
        <div className="card" style={{ padding: '0 14px', borderRadius: 16 }}>
          {departures ? departures.map(d => (
            <FullDepartureRow key={d.id} d={d} onOpen={() => onOpenJourney(d, station.code)} />
          )) : (
            <div role="status" aria-busy="true" aria-label="Loading departures…">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--line-row)' }}>
                  <div className="skeleton" style={{ height: 18, width: 50, marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 16, width: '50%' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}
