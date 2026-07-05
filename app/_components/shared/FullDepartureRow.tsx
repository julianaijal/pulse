'use client';

import React from 'react';
import { IDeparture } from '../../interfaces/interfaces';
import { formatTime } from '../../_utils/format';

interface FullDepartureRowProps {
  d: IDeparture;
  onOpen: () => void;
}

export default function FullDepartureRow({ d, onOpen }: FullDepartureRowProps) {
  const timeStr = formatTime(d.actualDateTime);

  return (
    <button
      onClick={onOpen}
      aria-label={`${d.direction}, departs ${timeStr}${d.delayMinutes > 0 ? `, ${d.delayMinutes} min delay` : ', on time'}${d.cancelled ? ', cancelled' : ''}${d.trackChanged && !d.cancelled ? `, track changed to ${d.actualTrack}` : ''}. Opens journey details.`}
      style={{
        width: '100%', padding: '12px 0', display: 'flex', gap: 12, alignItems: 'center',
        borderBottom: '1px solid var(--line-row)', textAlign: 'left',
        background: 'transparent', transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--subtle)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      onFocus={e => (e.currentTarget.style.background = 'var(--subtle)')}
      onBlur={e => (e.currentTarget.style.background = 'transparent')}
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
          {d.trainCategory} {d.trainId ?? ''}
          {d.trackChanged && !d.cancelled && (
            <span style={{ fontWeight: 800, color: 'var(--warn-text)' }}> · track changed</span>
          )}
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
        border: d.trackChanged && !d.cancelled ? '1.5px solid var(--warn-accent)' : '1.5px solid var(--line)',
        background: d.trackChanged && !d.cancelled ? 'var(--warn-tint)' : 'transparent',
        borderRadius: 7,
        fontSize: 12, fontWeight: d.trackChanged && !d.cancelled ? 800 : 700,
        color: d.trackChanged && !d.cancelled ? 'var(--warn-text)' : 'var(--ink)',
      }}>
        {d.cancelled ? '—' : d.actualTrack}
      </span>
    </button>
  );
}
