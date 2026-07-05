'use client';

import React from 'react';
import { IDeparture } from '../../interfaces/interfaces';

interface FullDepartureRowProps {
  d: IDeparture;
  onOpen: () => void;
}

export default function FullDepartureRow({ d, onOpen }: FullDepartureRowProps) {
  const actual = new Date(d.actualDateTime);
  const timeStr = actual.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <button
      onClick={onOpen}
      aria-label={`${d.direction}, departs ${timeStr}${d.delayMinutes > 0 ? `, ${d.delayMinutes} min delay` : ', on time'}${d.cancelled ? ', cancelled' : ''}. Opens journey details.`}
      style={{
        width: '100%', padding: '12px 0', display: 'flex', gap: 12, alignItems: 'center',
        borderBottom: '1px solid var(--line-row)', textAlign: 'left',
        background: 'transparent', transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--subtle)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Time column */}
      <div style={{ width: 48 }}>
        <div className="num" style={{
          fontSize: 16, fontWeight: 800,
          textDecoration: d.cancelled ? 'line-through' : 'none',
          color: d.cancelled ? 'var(--ink-cancel)' : 'var(--ink)',
        }}>
          {timeStr}
        </div>
        {d.delayMinutes > 0 && !d.cancelled && (
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--warn-text)', marginTop: 2 }}>
            +{d.delayMinutes} min
          </div>
        )}
      </div>

      {/* Middle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{d.direction}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
          {d.trainCategory} {d.trainId ?? ''}{d.trackChanged ? ' · track changed' : ''}
        </div>
      </div>

      {/* Status */}
      <span style={{
        fontSize: 12, fontWeight: d.cancelled || d.delayMinutes > 0 ? 800 : 700, whiteSpace: 'nowrap',
        color: d.cancelled ? 'var(--bad)' : d.delayMinutes > 0 ? 'var(--warn-text)' : 'var(--ok-text)',
      }}>
        {d.cancelled ? 'cancelled' : d.delayMinutes > 0 ? 'delayed' : 'on time'}
      </span>

      {/* Track badge */}
      <span style={{
        minWidth: 28, textAlign: 'center', padding: '2px 6px',
        border: '1.5px solid var(--line)', borderRadius: 7,
        fontSize: 12, fontWeight: 700, color: 'var(--ink)',
      }}>
        {d.cancelled ? '—' : d.actualTrack}
      </span>
    </button>
  );
}
