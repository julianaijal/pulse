'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { IDeparture, ITweaks } from '../../interfaces/interfaces';
import { generateDepartures } from '../../_utils/mock';
import { IconSwap } from '../icons/Icons';
import CrowdingStrip from '../shared/CrowdingStrip';
import DepartureRow from '../shared/DepartureRow';
import NowPill from '../shared/NowPill';

interface RhythmViewProps {
  tweaks: ITweaks;
  homeStation: { code: string; name: string } | null;
  workStation: { code: string; name: string } | null;
  onOpenJourney: (train: IDeparture, fromCode?: string) => void;
  onOpenStation: (station: { code: string; name: string }) => void;
  onEditCommute: () => void;
}

const DEMO_BASELINE = {
  usualDuration: 27,
  historyWeeks: 12,
  onTimeRate: 0.89,
  avgCrowding: 0.62,
};

export default function RhythmView({ tweaks, homeStation, workStation, onOpenJourney, onOpenStation, onEditCommute }: RhythmViewProps) {
  const home = homeStation ?? { code: 'ASD', name: 'Amsterdam Centraal' };
  const work = workStation ?? { code: 'UT', name: 'Utrecht Centraal' };
  const [now, setNow] = useState(new Date());
  const [departures, setDepartures] = useState<IDeparture[] | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let active = true;
    let abortCtrl: AbortController | null = null;
    let hasData = false;

    const fetchData = async () => {
      if (!active || document.visibilityState !== 'visible') return;
      abortCtrl?.abort();
      const ctrl = new AbortController();
      abortCtrl = ctrl;
      try {
        const res = await fetch(`/api/departures/${home.code}`, { signal: ctrl.signal });
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            hasData = true;
            setDepartures(data);
            return;
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
      if (active && !hasData) setDepartures(generateDepartures(home.code, new Date()));
    };

    fetchData();
    const timer = setInterval(fetchData, 60_000);
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      abortCtrl?.abort();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [home.code]);

  const yourTrain = useMemo(() => {
    if (!departures) return null;
    return departures.find(d => (d.direction === work.name || d.destinationCode === work.code) && d.trainCategory === 'IC')
      ?? departures.find(d => d.direction === work.name || d.destinationCode === work.code)
      ?? departures[0];
  }, [departures, work.name, work.code]);

  const alternatives = useMemo(() => {
    if (!departures) return [];
    return departures.filter(d =>
      d.direction === work.name || d.destinationCode === work.code
    ).slice(0, 3);
  }, [departures, work.name, work.code]);

  const dateLabel = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const hour = now.getHours();
  const greeting = hour < 6 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const shortHome = home.name.replace(' Centraal', ' C');
  const shortWork = work.name.replace(' Centraal', ' C');

  return (
    <div className="view fade-up">
      {/* Masthead */}
      <div style={{ padding: '24px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>{dateLabel}</div>
          <h1 style={{ fontSize: 23, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{greeting}</h1>
        </div>
        <NowPill />
      </div>

      {/* Commute chip — mobile */}
      <div className="rhythm-commute-chip" style={{ padding: '0 18px 12px' }}>
        <button onClick={onEditCommute} aria-label={`Edit commute: ${home.name} to ${work.name}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', background: 'var(--card)', border: '1px solid var(--line)',
          borderRadius: 999, fontSize: 13, fontWeight: 600, color: 'var(--ink)',
        }}>
          {shortHome} <span style={{ color: 'var(--primary)' }}>→</span> {shortWork} <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>›</span>
        </button>
      </div>

      {/* Departures live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {departures ? `${departures.length} departures loaded` : ''}
      </div>

      {/* Desktop grid */}
      <div className="rhythm-grid">
        <div className="rhythm-col-l">
          {/* Hero card */}
          <div style={{ padding: '0 18px' }}>
            {yourTrain ? (
              <HeroCard train={yourTrain} home={home} now={now} onClick={() => onOpenJourney(yourTrain, home.code)} />
            ) : (
              <div className="card" style={{ padding: 20, height: 200, borderRadius: 20 }}>
                <div className="skeleton" style={{ height: 50, marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 20, width: '40%' }} />
              </div>
            )}
          </div>

          {/* Smart swap */}
          {yourTrain && yourTrain.delayMinutes >= 2 && (
            <SmartSwap train={yourTrain} alternatives={alternatives.slice(1)} onSwap={d => onOpenJourney(d, home.code)} />
          )}

          {/* Later today */}
          <LaterToday departures={departures} onOpen={d => onOpenJourney(d, home.code)} tweaks={tweaks} home={home} onSeeAll={() => onOpenStation(home)} />
        </div>

        <div className="rhythm-col-r">
          <BaselineBlock />
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}

/* ── Helper ── */

function quietestCar(crowding: number[]): number {
  let min = 1, idx = 0;
  crowding.forEach((c, i) => { if (c < min) { min = c; idx = i; } });
  return idx;
}

/* ── Hero Card ── */

function HeroCard({ train, home, now, onClick }: {
  train: IDeparture;
  home: { code: string; name: string };
  now: Date;
  onClick: () => void;
}) {
  const actual = new Date(train.actualDateTime);
  const planned = new Date(train.plannedDateTime);
  const minsTo = Math.max(0, Math.round((actual.getTime() - now.getTime()) / 60000));
  const late = train.delayMinutes;
  const timeStr = actual.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const plannedStr = planned.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const crowding = train.crowding ?? [];
  const quietIdx = crowding.length > 0 ? quietestCar(crowding) : -1;

  // Walk-by time: subtract 12 minutes from departure
  const walkBy = new Date(actual.getTime() - 12 * 60000);
  const walkByStr = walkBy.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <button onClick={onClick} aria-label={`Your train to ${train.direction}, departs ${timeStr}${late > 0 ? `, ${late} min delay` : ', on time'}${train.trackChanged ? `, track changed to ${train.actualTrack}` : ''}. Opens journey details.`} style={{
      width: '100%', textAlign: 'left', padding: 0,
      background: 'var(--primary-deep)', color: '#FFFFFF',
      borderRadius: 20, overflow: 'hidden', display: 'block', border: 'none',
    }}>
      {/* Top strip */}
      <div style={{ padding: '16px 18px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="eyebrow" style={{ color: 'var(--primary-muted)', letterSpacing: '0.1em' }}>YOUR NEXT TRAIN</span>
        <span style={{
          padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
          background: 'rgba(255,255,255,0.12)', color: '#FFFFFF',
        }}>
          {train.trainCategory} {train.trainId ?? ''}
        </span>
      </div>

      {/* Big time + track */}
      <div style={{ padding: '0 18px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="num" style={{ fontSize: 62, fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.03em' }}>
            {timeStr}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            {late > 0 && (
              <span style={{
                padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                background: 'var(--warn)', color: 'var(--warn-dark)',
              }}>
                +{late} min
              </span>
            )}
            {late > 0 && (
              <span style={{ fontSize: 12, color: 'var(--primary-muted)', textDecoration: 'line-through' }}>
                plan {plannedStr}
              </span>
            )}
            {late === 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ok-light)' }}>on time</span>
            )}
          </div>
        </div>

        {/* Track box */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            border: train.trackChanged ? '2px solid var(--warn)' : '2px solid rgba(255,255,255,0.35)',
            background: train.trackChanged ? 'var(--warn)' : 'transparent',
            color: train.trackChanged ? 'var(--warn-dark)' : '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19, fontWeight: 800,
          }}>
            {train.actualTrack}
          </div>
          <span style={{ fontSize: 10, fontWeight: train.trackChanged ? 800 : 700, letterSpacing: '0.1em', marginTop: 3, color: train.trackChanged ? 'var(--warn)' : 'var(--primary-muted)' }}>
            {train.trackChanged ? 'NEW TRACK' : 'TRACK'}
          </span>
        </div>
      </div>

      {/* Destination + caption */}
      <div style={{ padding: '4px 18px 14px' }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>{train.direction}</div>
        <div style={{ fontSize: 12, color: 'var(--primary-muted)', marginTop: 3 }}>
          from {home.name} · leaves in {minsTo} min · walk by {walkByStr}
        </div>
      </div>

      {/* Crowding strip */}
      {crowding.length > 0 && (
        <div style={{ padding: '12px 18px 16px', borderTop: '1px solid rgba(255,255,255,0.14)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="eyebrow" style={{ color: 'var(--primary-muted)' }}>
              CROWDING · BOARD CAR {quietIdx + 1}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ok-light)' }}>
              {quietIdx < crowding.length / 2 ? 'Front is quietest' : 'Rear is quietest'}
            </span>
          </div>
          <CrowdingStrip crowding={crowding} variant="hero" recommendedCar={quietIdx} />
        </div>
      )}
    </button>
  );
}

/* ── Smart Swap ── */

function SmartSwap({ train, alternatives, onSwap }: { train: IDeparture; alternatives: IDeparture[]; onSwap: (d: IDeparture) => void }) {
  const best = alternatives[0];
  if (!best) return null;
  const bestTime = new Date(best.actualDateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ padding: '12px 18px 0' }}>
      <div
        role="alert"
        style={{
          background: 'var(--warn-tint)', borderRadius: 15, padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 10, background: 'var(--warn)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IconSwap style={{ width: 18, height: 18, color: '#FFFFFF' }} />
        </div>
        <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>
          The <strong>{bestTime} {best.trainCategory}</strong> beats your delayed train and is emptier.
        </div>
        <button
          onClick={() => onSwap(best)}
          aria-label={`Swap to the ${bestTime} ${best.trainCategory}`}
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', padding: '4px 8px', whiteSpace: 'nowrap' }}
        >
          Swap
        </button>
      </div>
    </div>
  );
}

/* ── Baseline ── */

function BaselineBlock() {
  return (
    <div style={{ padding: '16px 18px 4px' }}>
      <h2 className="eyebrow" style={{ marginBottom: 10 }}>YOUR BASELINE · {DEMO_BASELINE.historyWeeks} WEEKS</h2>
      <div className="card" style={{ padding: 16, borderRadius: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <StatTile big={(DEMO_BASELINE.onTimeRate * 100).toFixed(0)} suffix="%" label="on time" />
          <StatTile big={String(DEMO_BASELINE.usualDuration)} suffix="m" label="avg ride" />
          <StatTile big={(DEMO_BASELINE.avgCrowding * 100).toFixed(0)} suffix="%" label="avg crowd" />
        </div>
      </div>
    </div>
  );
}

function StatTile({ big, suffix, label }: { big: string; suffix: string; label: string }) {
  return (
    <div style={{ background: 'var(--subtle)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
      <div className="num" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 1 }}>
        <span style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>{big}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

/* ── Later Today ── */

function LaterToday({ departures, onOpen, tweaks, home, onSeeAll }: { departures: IDeparture[] | null; onOpen: (d: IDeparture) => void; tweaks: ITweaks; home: { code: string; name: string }; onSeeAll: () => void }) {
  if (!departures) return null;
  const list = departures.slice(0, tweaks.verbosity === 'minimal' ? 3 : 6);
  return (
    <div style={{ padding: '16px 18px 4px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 className="eyebrow">LATER TODAY · {home.code}</h2>
        <button onClick={onSeeAll} aria-label={`See all departures from ${home.name}`} style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>See all</button>
      </div>
      <div className="card" style={{ padding: '0 14px', borderRadius: 16 }}>
        {list.map(d => (
          <DepartureRow key={d.id} d={d} onClick={() => onOpen(d)} />
        ))}
      </div>
    </div>
  );
}
