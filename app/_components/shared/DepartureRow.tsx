'use client';

import React from 'react';
import { IDeparture } from '../../interfaces/interfaces';
import { formatTime } from '../../_utils/format';

interface DepartureRowProps {
  d: IDeparture;
  onClick: () => void;
}

export default function DepartureRow({ d, onClick }: DepartureRowProps) {
  const timeStr = formatTime(d.actualDateTime);

  return (
    <button
      onClick={onClick}
      aria-label={`${d.direction}, departs ${timeStr}${d.delayMinutes > 0 ? `, ${d.delayMinutes} min delay` : ', on time'}${d.cancelled ? ', cancelled' : ''}${d.trackChanged && !d.cancelled ? `, track changed to ${d.actualTrack}` : ''}. Opens journey details.`}
      style={{
        width: '100%', padding: '11px 0', display: 'flex', gap: 10, alignItems: 'center',
        borderBottom: '1px solid var(--line-row)', textAlign: 'left',
        background: 'transparent', transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--subtle)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      onFocus={e => (e.currentTarget.style.background = 'var(--subtle)')}
      onBlur={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Time */}
      <div className="num" style={{
        width: 48, fontSize: 15, fontWeight: 800,
        textDecoration: d.cancelled ? 'line-through' : 'none',
        color: d.cancelled ? 'var(--ink-cancel)' : 'var(--ink)',
      }}>
        {timeStr}
      </div>

      {/* Category badge */}
      <span style={{
        padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 700,
        background: d.cancelled ? 'var(--bad-tint)' : 'var(--primary-tint)',
        color: d.cancelled ? 'var(--bad)' : 'var(--primary)',
      }}>
        {d.trainCategory}
      </span>

      {/* Destination */}
      <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {d.direction}
      </span>

      {/* Status */}
      <span style={{
        fontSize: 12, fontWeight: d.cancelled || d.delayMinutes > 0 ? 800 : 700, whiteSpace: 'nowrap',
        color: d.cancelled ? 'var(--bad)' : d.delayMinutes > 0 ? 'var(--warn-text)' : 'var(--ok-text)',
      }}>
        {d.cancelled ? 'cancelled' : d.delayMinutes > 0 ? `+${d.delayMinutes} min` : 'on time'}
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
