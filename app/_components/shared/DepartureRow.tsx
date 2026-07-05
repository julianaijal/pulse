'use client';

import React from 'react';
import { IDeparture } from '../../interfaces/interfaces';

interface DepartureRowProps {
  d: IDeparture;
  onClick: () => void;
}

export default function DepartureRow({ d, onClick }: DepartureRowProps) {
  const actual = new Date(d.actualDateTime);
  const timeStr = actual.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

  return (
    <button
      onClick={onClick}
      aria-label={`${d.direction}, vertrekt ${timeStr}${d.delayMinutes > 0 ? `, ${d.delayMinutes} min vertraging` : ', op tijd'}${d.cancelled ? ', geannuleerd' : ''}. Klik voor reisdetails.`}
      style={{
        width: '100%', padding: '11px 0', display: 'flex', gap: 10, alignItems: 'center',
        borderBottom: '1px solid var(--line-row)', textAlign: 'left',
        background: 'transparent', transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--subtle)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
        color: d.cancelled ? 'var(--bad)' : d.delayMinutes > 0 ? 'var(--warn-accent)' : 'var(--ok)',
      }}>
        {d.cancelled ? 'cancelled' : d.delayMinutes > 0 ? `+${d.delayMinutes}` : 'on time'}
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
