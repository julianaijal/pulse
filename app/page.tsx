'use client';

import React, { useState, useEffect } from 'react';
import { IDeparture, ITweaks, CommuteStation } from './interfaces/interfaces';
import TabBar from './_components/TabBar';
import TweaksPanel from './_components/TweaksPanel';
import RhythmView from './_components/views/RhythmView';
import PulseView from './_components/views/PulseView';
import JourneyView from './_components/views/JourneyView';
import StationView, { StationSearch } from './_components/views/StationView';
import {
  IconRhythm, IconPulse, IconJourney, IconSearch, IconTweaks,
} from './_components/icons/Icons';

type Tab = 'rhythm' | 'pulse' | 'journey' | 'station' | 'search';

interface StationObj {
  code: string;
  name: string;
  lat?: number;
  lng?: number;
}

const DEMO_BASELINE = { usualDuration: 27, onTimeRate: 0.89 };

const TWEAK_DEFAULTS: ITweaks = {
  verbosity: 'rich',
};

function loadTweaks(): ITweaks {
  if (typeof window === 'undefined') return TWEAK_DEFAULTS;
  return {
    verbosity: (localStorage.getItem('pulse.verbosity') as ITweaks['verbosity']) ?? TWEAK_DEFAULTS.verbosity,
  };
}

const NAV_ITEMS = [
  { id: 'rhythm',  label: 'Home',     Icon: IconRhythm  },
  { id: 'pulse',   label: 'Network',  Icon: IconPulse   },
  { id: 'journey', label: 'Journeys', Icon: IconJourney },
  { id: 'search',  label: 'Stations', Icon: IconSearch  },
] as const;

export default function Home() {
  const [tweaks, setTweaks]       = useState<ITweaks>(TWEAK_DEFAULTS);
  const [tab, setTab]             = useState<Tab>('rhythm');
  const [journey, setJourney]     = useState<{ train: IDeparture; fromCode?: string } | null>(null);
  const [station, setStation]     = useState<{ station: StationObj; origin: Tab } | null>(null);
  const [showTweaks, setShowTweaks] = useState(false);
  const [commute, setCommute]     = useState<{ home: CommuteStation | null; work: CommuteStation | null }>({ home: null, work: null });

  // Hydrate from localStorage after mount
  useEffect(() => {
    queueMicrotask(() => {
      setTweaks(loadTweaks());
      const saved = localStorage.getItem('pulse.tab') as Tab | null;
      if (saved && ['rhythm', 'pulse', 'journey', 'station', 'search'].includes(saved)) {
        setTab(saved);
      }
      const parseStation = (key: string): CommuteStation | null => {
        try { return JSON.parse(localStorage.getItem(key) ?? ''); }
        catch { return null; }
      };
      setCommute({
        home: parseStation('pulse.homeStation') ?? { code: 'ASD', name: 'Amsterdam Centraal' },
        work: parseStation('pulse.workStation') ?? { code: 'UT', name: 'Utrecht Centraal' },
      });
    });
  }, []);

  useEffect(() => { localStorage.setItem('pulse.tab', tab); }, [tab]);

  const updateTweak = (key: keyof ITweaks, value: string) => {
    setTweaks(t => ({ ...t, [key]: value } as ITweaks));
    if (key === 'verbosity') localStorage.setItem('pulse.verbosity', value);
  };

  const setCommuteStation = (key: 'home' | 'work', station: CommuteStation) => {
    setCommute(c => ({ ...c, [key]: station }));
    localStorage.setItem(key === 'home' ? 'pulse.homeStation' : 'pulse.workStation', JSON.stringify(station));
  };

  const openJourney = (train: IDeparture, fromCode?: string) => { setJourney({ train, fromCode }); setTab('journey'); };
  const openStation = (s: StationObj)     => { setStation({ station: s, origin: tab }); setTab('station'); };

  const goTo = (id: string) => {
    if (id === 'search') { setStation(null); setTab('search'); }
    else setTab(id as Tab);
  };

  // Active tab for nav highlighting (station renders under its origin tab)
  const activeNav = tab === 'station' ? (station?.origin ?? 'pulse') : tab;

  let content: React.ReactNode;
  if      (tab === 'rhythm')  content = <RhythmView  tweaks={tweaks} homeStation={commute.home} workStation={commute.work} onOpenJourney={openJourney} onOpenStation={openStation} onEditCommute={() => setShowTweaks(true)} />;
  else if (tab === 'pulse')   content = <PulseView   tweaks={tweaks} onOpenJourney={openJourney} onOpenStation={openStation} />;
  else if (tab === 'journey') content = <JourneyView train={journey?.train ?? null} fromCode={journey?.fromCode} onBack={() => setTab('rhythm')} onNavigate={goTo} />;
  else if (tab === 'station') content = <StationView station={station?.station ?? null} tweaks={tweaks} onBack={() => setTab(station?.origin ?? 'pulse')} onOpenJourney={openJourney} />;
  else if (tab === 'search')  content = <StationSearch onBack={() => setTab('rhythm')} onPick={openStation} />;

  return (
    <div className="pulse-shell">

      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="pulse-sidebar">
        {/* Logo */}
        <div className="pulse-sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 16 20" fill="none">
              <path d="M2 10h3l2-5 3 10 2.5-7 1.5 2h4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.1, color: 'var(--ink)' }}>Pulse</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', lineHeight: 1.2 }}>Dutch rail companion</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="pulse-sidebar-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className="pulse-sidebar-item"
              data-active={activeNav === id}
              aria-current={activeNav === id ? 'page' : undefined}
              onClick={() => goTo(id)}
            >
              <Icon aria-hidden="true" style={{ width: 20, height: 20 }} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Commute card */}
        <div style={{
          background: 'var(--subtle)', borderRadius: 12, padding: '12px 14px', marginBottom: 12,
        }}>
          <div className="eyebrow" style={{ marginBottom: 6, fontSize: 10 }}>MY COMMUTE</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{commute.home?.name ? commute.home.name.replace(' Centraal', ' C').replace('Amsterdam', 'Amsterdam') : 'Home'}</span>
            <span style={{ color: 'var(--primary)' }}>→</span>
            <span>{commute.work?.name ? commute.work.name.replace(' Centraal', ' C') : 'Work'}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
            {DEMO_BASELINE.usualDuration} min avg · {(DEMO_BASELINE.onTimeRate * 100).toFixed(0)}% on time
          </div>
        </div>

        {/* Tweaks */}
        <button
          className="pulse-sidebar-item"
          data-active={showTweaks}
          onClick={() => setShowTweaks(v => !v)}
        >
          <IconTweaks aria-hidden="true" style={{ width: 20, height: 20 }} />
          <span>Tweaks</span>
        </button>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <main id="main-content" tabIndex={-1} className="pulse-main">
        {content}
        <TabBar
          tab={activeNav as 'rhythm' | 'pulse' | 'journey' | 'search'}
          onTabChange={goTo}
        />
      </main>

      {/* Mobile tweaks FAB (hidden on desktop via CSS) */}
      <button
        className="pulse-tweaks-fab"
        onClick={() => setShowTweaks(v => !v)}
        aria-label="Open tweaks"
      >
        <IconTweaks style={{ width: 16, height: 16 }} />
      </button>

      {showTweaks && (
        <TweaksPanel tweaks={tweaks} onChange={updateTweak} commute={commute} onCommuteChange={setCommuteStation} onClose={() => setShowTweaks(false)} />
      )}
    </div>
  );
}
