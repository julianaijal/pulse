'use client';

import React, { useState, useEffect } from 'react';
import { IDeparture, ITweaks } from './interfaces/interfaces';
import { ACCENT_MAP } from './_components/TweaksPanel';
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

const TWEAK_DEFAULTS: ITweaks = {
  theme: 'light',
  verbosity: 'rich',
  crowdingStyle: 'bars',
  accent: 'orange',
};

function loadTweaks(): ITweaks {
  if (typeof window === 'undefined') return TWEAK_DEFAULTS;
  return {
    theme:        (localStorage.getItem('pulse.theme')        as ITweaks['theme'])        ?? TWEAK_DEFAULTS.theme,
    verbosity:    (localStorage.getItem('pulse.verbosity')    as ITweaks['verbosity'])    ?? TWEAK_DEFAULTS.verbosity,
    crowdingStyle:(localStorage.getItem('pulse.crowdingStyle')as ITweaks['crowdingStyle'])?? TWEAK_DEFAULTS.crowdingStyle,
    accent:       (localStorage.getItem('pulse.accent')       as ITweaks['accent'])       ?? TWEAK_DEFAULTS.accent,
  };
}

const NAV_ITEMS = [
  { id: 'rhythm',  label: 'Rhythm',  Icon: IconRhythm  },
  { id: 'pulse',   label: 'Pulse',   Icon: IconPulse   },
  { id: 'journey', label: 'Journey', Icon: IconJourney },
  { id: 'search',  label: 'Search',  Icon: IconSearch  },
] as const;

export default function Home() {
  const [tweaks, setTweaks]       = useState<ITweaks>(TWEAK_DEFAULTS);
  const [tab, setTab]             = useState<Tab>('rhythm');
  const [journey, setJourney]     = useState<IDeparture | null>(null);
  const [station, setStation]     = useState<StationObj | null>(null);
  const [showTweaks, setShowTweaks] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    setTweaks(loadTweaks());
    const saved = localStorage.getItem('pulse.tab') as Tab | null;
    if (saved && ['rhythm', 'pulse', 'journey', 'station', 'search'].includes(saved)) {
      setTab(saved);
    }
  }, []);

  useEffect(() => { localStorage.setItem('pulse.tab', tab); }, [tab]);

  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.style.setProperty('--accent', ACCENT_MAP[tweaks.accent] ?? ACCENT_MAP.orange);
  }, [tweaks.theme, tweaks.accent]);

  const updateTweak = (key: keyof ITweaks, value: string) => {
    setTweaks(t => ({ ...t, [key]: value }));
    localStorage.setItem(`pulse.${key}`, value);
  };

  const openJourney = (train: IDeparture) => { setJourney(train); setTab('journey'); };
  const openStation = (s: StationObj)     => { setStation(s);  setTab('station'); };

  const goTo = (id: string) => {
    if (id === 'search')  { setStation(null); setTab('search'); }
    else if (id === 'journey') setTab(journey ? 'journey' : 'rhythm');
    else setTab(id as Tab);
  };

  // Active tab for nav highlighting (station renders under pulse)
  const activeNav = tab === 'station' ? 'pulse' : tab;

  let content: React.ReactNode;
  if      (tab === 'rhythm')  content = <RhythmView  tweaks={tweaks} onOpenJourney={openJourney} onOpenStation={openStation} />;
  else if (tab === 'pulse')   content = <PulseView   tweaks={tweaks} onOpenJourney={openJourney} onOpenStation={openStation} />;
  else if (tab === 'journey') content = <JourneyView train={journey} tweaks={tweaks} onBack={() => setTab('rhythm')} />;
  else if (tab === 'station') content = <StationView station={station} tweaks={tweaks} onBack={() => setTab('pulse')} onOpenJourney={openJourney} />;
  else if (tab === 'search')  content = <StationSearch onBack={() => setTab('rhythm')} onPick={openStation} />;

  return (
    <div className="pulse-shell">

      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="pulse-sidebar">
        {/* Logo */}
        <div className="pulse-sidebar-logo">
          <span className="serif" style={{ fontSize: 22, lineHeight: 1, letterSpacing: '-0.02em' }}>
            Pulse<em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>.</em>
          </span>
        </div>

        {/* Nav */}
        <nav className="pulse-sidebar-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className="pulse-sidebar-item"
              data-active={activeNav === id}
              onClick={() => goTo(id)}
            >
              <Icon aria-hidden="true" style={{ width: 20, height: 20 }} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

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
      <main
        id="main-content"
        tabIndex={-1}
        className="pulse-main"
        role="tabpanel"
        aria-labelledby={`tab-${activeNav}`}
      >
        {content}
        <TabBar
          tab={activeNav as 'rhythm' | 'pulse' | 'journey' | 'search'}
          hasJourney={journey !== null}
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
        <TweaksPanel tweaks={tweaks} onChange={updateTweak} onClose={() => setShowTweaks(false)} />
      )}
    </div>
  );
}
