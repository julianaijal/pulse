'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { STATIONS } from '../../_utils/mock';
import { IconSearch, IconClose } from '../icons/Icons';

interface StationPickerProps {
  label: string;
  value: { code: string; name: string } | null;
  onChange: (station: { code: string; name: string }) => void;
}

export default function StationPicker({ label, value, onChange }: StationPickerProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [apiResults, setApiResults] = useState<{ code: string; name: string; q: string }[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Local search (synchronous, derived from q)
  const localResults = useMemo(() => {
    if (!open) return [];
    const lo = q.toLowerCase();
    return q.length < 1
      ? STATIONS.slice(0, 5)
      : STATIONS.filter(s => s.name.toLowerCase().includes(lo) || s.code.toLowerCase().includes(lo)).slice(0, 5);
  }, [q, open]);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => inputRef.current?.focus());
  }, [open]);

  // Live API search for queries >= 2 chars
  useEffect(() => {
    if (!open || q.length < 2) return;
    let cancelled = false;
    fetch(`/api/stations?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setApiResults(data.slice(0, 5).map((s: { code: string; name: string }) => ({ ...s, q })));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [q, open]);

  // Use API results only if they match the current query; otherwise fall back to local
  const results = (apiResults && apiResults.length > 0 && apiResults[0].q === q)
    ? apiResults
    : localResults;

  const pick = (station: { code: string; name: string }) => {
    onChange(station);
    setOpen(false);
    setQ('');
    setApiResults(null);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={`${label}: ${value?.name ?? 'not set'}. Click to change.`}
        style={{
          width: '100%', padding: '10px 14px',
          background: 'var(--bg-2)', borderRadius: 10,
          border: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          textAlign: 'left',
        }}
      >
        <span className="serif" style={{ fontSize: 15 }}>
          {value?.name ?? 'Select station'}
        </span>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
          {value?.code ?? ''}
        </span>
      </button>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 10,
        border: '1px solid var(--accent)',
      }}>
        <IconSearch aria-hidden="true" style={{ width: 14, height: 14, color: 'var(--ink-3)', flexShrink: 0 }} />
        <label htmlFor={`picker-${label}`} className="sr-only">{label}</label>
        <input
          ref={inputRef}
          id={`picker-${label}`}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search stations…"
          style={{
            flex: 1, background: 'transparent', border: 0,
            fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit',
          }}
        />
        <button
          onClick={() => { setOpen(false); setQ(''); }}
          aria-label="Cancel"
          style={{ color: 'var(--ink-3)', padding: 2 }}
        >
          <IconClose aria-hidden="true" style={{ width: 14, height: 14 }} />
        </button>
      </div>
      <div style={{ marginTop: 4 }}>
        {results.map(s => (
          <button
            key={s.code}
            onClick={() => pick(s)}
            style={{
              width: '100%', padding: '8px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              textAlign: 'left', borderBottom: '1px solid var(--line-2)',
              fontSize: 14,
            }}
          >
            <span>{s.name}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{s.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
