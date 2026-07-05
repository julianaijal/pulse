'use client';

import React, { useRef, useEffect } from 'react';
import { ITweaks, CommuteStation } from '../interfaces/interfaces';
import { IconClose } from './icons/Icons';
import StationPicker from './shared/StationPicker';

interface TweaksPanelProps {
  tweaks: ITweaks;
  onChange: (key: keyof ITweaks, value: string) => void;
  commute: { home: CommuteStation | null; work: CommuteStation | null };
  onCommuteChange: (key: 'home' | 'work', station: CommuteStation) => void;
  onClose: () => void;
}

export default function TweaksPanel({ tweaks, onChange, commute, onCommuteChange, onClose }: TweaksPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Focus trap + Escape to close + focus restoration on unmount
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (!panel) return;

    const getFocusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );

    getFocusable()[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = getFocusable();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    panel.addEventListener('keydown', handleKeyDown);
    return () => {
      panel.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, []); // empty deps: run only on mount/unmount

  return (
    <div
      ref={panelRef}
      className="tweaks"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tweaks-title"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div id="tweaks-title" className="eyebrow">Tweaks</div>
        <button onClick={onClose} style={{ color: 'var(--ink-3)' }} aria-label="Close tweaks">
          <IconClose style={{ width: 16, height: 16 }} aria-hidden="true" />
        </button>
      </div>

      <TweakRow label="Your commute">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>FROM</div>
            <StationPicker label="From" value={commute.home} onChange={s => onCommuteChange('home', s)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => {
                if (commute.home && commute.work) {
                  const prev = { home: commute.home, work: commute.work };
                  onCommuteChange('home', prev.work);
                  onCommuteChange('work', prev.home);
                }
              }}
              aria-label="Swap home and work stations"
              style={{
                padding: '4px 12px', fontSize: 11, color: 'var(--ink-2)',
                background: 'var(--bg-2)', borderRadius: 100,
                border: '1px solid var(--line)',
              }}
            >
              ↕ swap
            </button>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>TO</div>
            <StationPicker label="To" value={commute.work} onChange={s => onCommuteChange('work', s)} />
          </div>
        </div>
      </TweakRow>

      <div className="hairline" style={{ margin: '2px 0 14px' }} />

      <TweakRow label="Verbosity">
        <Segmented
          label="Verbosity"
          value={tweaks.verbosity}
          onChange={v => onChange('verbosity', v)}
          options={[['minimal', 'Minimal'], ['rich', 'Data-rich']]}
        />
      </TweakRow>
    </div>
  );
}

function TweakRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function Segmented({ value, onChange, options, label }: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  label: string;
}) {
  const groupRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const idx = options.findIndex(([v]) => v === value);
    const next = e.key === 'ArrowRight'
      ? (idx + 1) % options.length
      : (idx - 1 + options.length) % options.length;
    onChange(options[next][0]);
    // Move focus to the next button
    const buttons = groupRef.current?.querySelectorAll<HTMLElement>('button');
    buttons?.[next]?.focus();
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
      style={{ display: 'flex', background: 'var(--bg-2)', padding: 3, borderRadius: 100, border: '1px solid var(--line)' }}
    >
      {options.map(([v, optionLabel]) => (
        <button
          key={v}
          role="radio"
          aria-checked={value === v}
          tabIndex={value === v ? 0 : -1}
          onClick={() => onChange(v)}
          style={{
            flex: 1, padding: '6px 10px', borderRadius: 100,
            fontSize: 12, fontWeight: 500,
            background: value === v ? 'var(--ink)' : 'transparent',
            color: value === v ? 'var(--bg)' : 'var(--ink-2)',
            transition: 'all 0.15s',
          }}
        >{optionLabel}</button>
      ))}
    </div>
  );
}
